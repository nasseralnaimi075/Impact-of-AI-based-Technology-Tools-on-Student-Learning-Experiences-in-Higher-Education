AI-Learning Experience Dashboard

AI-Learning Experience Dashboard is a web-based application designed to analyze student interactions with AI learning tools (like ChatGPT) and generate actionable insights to improve AI-mediated learning experiences in higher education. The project includes a Flask-based backend, data processing with Python, and a frontend dashboard that visualizes usage trends, trust levels, and ethical concerns of AI tools.

Table of Contents
Project Overview
Features
Tech Stack
Setup Instructions
Usage
File Structure
Contributing
License
Project Overview

The AI-Learning Experience Dashboard helps educators and institutions track and assess the usage of AI tools in the classroom. It visualizes:

Usage frequency of AI tools (like ChatGPT, Grammarly, etc.)
Trust levels students have in AI-generated content
Academic impact of AI tools on student learning
Ethical concerns such as AI over-dependence, academic integrity, and algorithmic bias

This dashboard serves as a decision-support system to guide institutions on the responsible and effective integration of AI in education.

Features
Student AI Usage Tracking: Monitors frequency and types of AI tools used.
Trust Heatmap: Visualizes students' trust in AI-generated content.
Recommendations: Automatically generates insights like "Introduce AI Literacy Workshops".
Ethical Concerns Tracking: Flags potential risks such as over-dependence on AI tools.
Data Visualization: Real-time interactive charts using Chart.js.
Backend API: Flask API to manage data and recommendations.
Data Analysis: Python scripts using pandas and seaborn for processing and analysis.
Tech Stack
Frontend:
HTML5
CSS3
JavaScript (Chart.js for data visualization)
Backend:
Python (Flask)
Pandas (for data manipulation)
Seaborn/Matplotlib (for data visualization)
Other Tools:
SQLite (or CSV for data storage)
GitHub (for version control)
Setup Instructions
Prerequisites

Ensure that you have the following installed:

Python 3.x
Flask
Git (for version control)
1. Clone the repository
git clone https://github.com/yourusername/AI-Learning-Experience-Dashboard.git
2. Install required dependencies

Navigate to the project directory and install the dependencies using pip.

cd AI-Learning-Experience-Dashboard
pip install -r requirements.txt
3. Set up your dataset

Download the AI Student Usage Dataset (provided in the project) and save it in the dataset/ directory.

Ensure that the dataset is cleaned and structured correctly (refer to the data_processing.py script for data handling).

4. Run the Flask app

To run the Flask server locally, execute the following command:

python app.py

The application will be accessible at http://127.0.0.1:5000/ in your browser.

Usage

Once the application is running:

Load the dataset by placing it in the dataset/ folder.
Navigate to the dashboard to view the visualizations and insights.
The dashboard will display charts that track AI tool usage, trust levels, and ethical concerns.
Review the insights: The dashboard will automatically generate recommendations and insights based on data trends.
File Structure
AI-Learning-Dashboard/
│
├── app.py                        # Main Flask application
│
├── dataset/                      # Folder for dataset
│     └── ai_learning_dataset.csv  # The dataset file (students' AI usage data)
│
├── analysis/                     # Folder for data processing scripts
│     └── data_processing.py       # Script for cleaning and analyzing dataset
│
├── templates/                    # Folder for HTML files
│     └── dashboard.html           # Dashboard page (displays the UI)
│
├── static/                       # Folder for static assets (CSS, JS)
│     ├── css/
│     │      └── style.css        # Styling for the dashboard page
│     ├── js/
│     │      └── charts.js        # JavaScript for interactive charts
│     └── images/                 # Folder for dashboard images (icons, charts)
│
├── recommendation_engine.py       # Script for generating insights and recommendations
│
└── requirements.txt              # List of required Python packages
Contributing

We welcome contributions to the project. If you want to improve the code or suggest new features:

Fork the repository.
Create a new branch (git checkout -b feature-name).
Commit your changes (git commit -am 'Add new feature').
Push to the branch (git push origin feature-name).
Open a pull request.
License

This project is licensed under the MIT License - see the LICENS
