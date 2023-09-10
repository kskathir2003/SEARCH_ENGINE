import os
import pymongo
import re
import math
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

# Initialize SnowballStemmer for English
stemmer = SnowballStemmer("english")

# Define MongoDB connection
mongo_client = pymongo.MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["newWebIndex"]
mongo_collection = mongo_db["newIndexCollection"]

# Definition tag priorities
tag_priorities = {
    'title': 1,
    'h1': 2,
    'h2': 3,
    'h3': 4,
    'h4': 5,
    'h5': 6,
    'h6': 7,
    'p': 8,
    'div': 9,
    'span': 10,
}

# Function to preprocess text-
def preprocess_text(text):
    # Tokenize, remove punctuation, lowercase, apply stemming, and remove stopwords
    tokens = re.findall(r'\b\w+\b', text.lower())
    tokens = [stemmer.stem(token) for token in tokens if token not in stopwords.words('english')]
    return tokens

# Function to calculate TF-IDF for a term in a document
def calculate_tf_idf(term, doc_tokens, doc_count, inverted_index):
    tf = doc_tokens.count(term) / len(doc_tokens)
    idf = math.log(doc_count / (len(inverted_index.get(term, [])) + 1))
    return tf * idf

# Function to process an HTML document
def process_html_document(html_content, document_count):

    # Parsing HTML
    soup = BeautifulSoup(html_content, 'html.parser')

    # Create a dictionary to store keyword frequencies
    keyword_frequencies = {}

    for tag, priority in tag_priorities.items():
        elements = soup.find_all(tag)
        for element in elements:
            text = element.get_text(strip=True)
            if text:
                # Preprocess and stem the text
                tokens = preprocess_text(text)
                for token in tokens:
                    if token not in keyword_frequencies:
                        keyword_frequencies[token] = {
                            'documents': [{
                                'no': document_count,
                                'freq': tokens.count(token),
                                'priority': tag_priorities[tag],
                                'tf-idf': 0.0
                            }]
                        }
                    else:
                        existing_entry = keyword_frequencies[token]['documents'][0]
                        if tag_priorities[tag] < existing_entry['priority']:

                            existing_entry['priority'] = tag_priorities[tag]
                        existing_entry['freq'] += tokens.count(token)

    # Store the HTML text content in the 'html' field of the document
    return {
        'document_number': document_count,
        'keyword_frequencies': keyword_frequencies
    }

# Main loop to process HTML documents and calculate TF-IDF
document_count = 1
documents = []

base_directory = 'C:\\Users\\HP\\crawler-bucket\\Folder_1'
print(f"Base Directory: {base_directory}")

for folder_name in os.listdir(base_directory):
    sub_folder = os.path.join(base_directory, folder_name)
    if os.path.isdir(sub_folder):
        try:
            # Check for HTML files and process them
            html_files = [f for f in os.listdir(sub_folder) if f.endswith(('.html', '.htm'))]
            if html_files:
                html_path = os.path.join(sub_folder, html_files[0])  # Use the first HTML file found
                with open(html_path, 'r', encoding='utf-8', errors='ignore') as html_file:
                    html_content = html_file.read()
                document_data = process_html_document(html_content, document_count)
                if document_data:
                    documents.append(document_data)
                    document_count += 1
                    print(f"Document {document_count - 1} indexed in folder: {sub_folder}")
            else:
                print(f"No HTML file found in folder: {sub_folder}")
        except Exception as e:
            print(f"Error processing folder {sub_folder}: {str(e)}")

# Inverted Index and Document Frequency
inverted_index = {}
document_frequency = {}

for doc in documents:
    for term, frequencies in doc['keyword_frequencies'].items():
        if term not in inverted_index:
            inverted_index[term] = []
        inverted_index[term].extend(frequencies['documents'])

# Calculate TF-IDF scores
for doc in documents:
    doc['tf_idf'] = {}
    doc_tokens = list(doc['keyword_frequencies'].keys())
    total_keywords = len(doc_tokens)

    for term in doc_tokens:
        for entry in doc['keyword_frequencies'][term]['documents']:
            term_freq = entry['freq']
            priority = entry['priority']
            tf_idf = calculate_tf_idf(term, doc_tokens, len(documents), inverted_index)
            entry['tf-idf'] = tf_idf


for doc in documents:
    doc.pop('html', None)
    mongo_collection.insert_one(doc)


mongo_client.close()
