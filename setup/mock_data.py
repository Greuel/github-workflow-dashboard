import random
import psycopg2
from faker import Faker

# Create an instance of the Faker generator
fake = Faker()

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

for _ in range(10):
    repo_name = f'{fake.name().replace(" ", "-")}-{fake.company_suffix().replace(" ", "-")}/{fake.slug()}'
    workflow_name = fake.bs().replace(" ", "-")
    job_id = fake.random_int(min=1, max=100000)
    run_id = fake.random_int(min=1, max=100000)
    labels = ', '.join([f'{label}-{fake.random_element(elements=("runner", "hosted"))}' for label in fake.words(nb=3)])
    event_type = random.choice(['queued', 'in_progress', 'completed', 'waiting'])
    created_at = fake.date_time_this_year()

    query = "INSERT INTO workflow_runs (repo_name, workflow_name, run_id, job_id, labels, event_type, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    values = (repo_name, workflow_name, run_id, job_id, labels, event_type, created_at)

    cursor.execute(query, values)

# Commit the changes to the database
conn.commit()

# Close the cursor and the database connection
cursor.close()
conn.close()
