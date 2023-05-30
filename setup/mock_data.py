import random
import string
import psycopg2
from datetime import date, timedelta

# Generate a random string of given length
def generate_random_string(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for _ in range(length))

# Generate a random date within a range
def generate_random_date(start_date, end_date):
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    random_date = start_date + timedelta(days=random_days)
    return random_date

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    database="github",
    user="postgres",
    password="postgres"
)

# Create the 'workflow_runs' table if it doesn't exist
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflow_runs (
        id SERIAL PRIMARY KEY,
        repo_name VARCHAR(255),
        workflow_name VARCHAR(255),
        run_id INT,
        job_id INT,
        labels VARCHAR(255),
        event_type VARCHAR(255),
        created_at DATE
    )
""")
conn.commit()
# Generate and insert mock data into the database
start_date = date(2023, 1, 1)
end_date = date.today()

for _ in range(10):
    repo_name = generate_random_string(10)
    workflow_name = generate_random_string(8)
    run_id = random.randint(1000, 9999)
    job_id = random.randint(1, 100)
    status = random.choice(['queued', 'in_progress', 'completed', 'waiting'])
    labels = generate_random_string(5)
    event_type = status
    created_at = generate_random_date(start_date, end_date)

    query = "INSERT INTO workflow_runs (repo_name, workflow_name, run_id, job_id, labels, event_type, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    values = (repo_name, workflow_name, run_id, job_id, labels, event_type, created_at)

    cursor.execute(query, values)

# Commit the changes to the database
conn.commit()

# Close the cursor and the database connection
cursor.close()
conn.close()
