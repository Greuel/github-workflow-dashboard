from flask import Flask, request, jsonify, abort
from sqlalchemy import create_engine, Column, Integer, BigInteger, String, DateTime, exists, select, not_
from sqlalchemy.orm import sessionmaker
from sqlalchemy import exc
from sqlalchemy import literal
from sqlalchemy import text
from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase as declarative_base
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import requests
import hashlib
import hmac
import logging
import os
import time

app = Flask(__name__)

org_name = os.getenv('ORG_NAME')
access_token = os.getenv('ACCESS_TOKEN')
postgres_user = os.getenv('POSTGRES_USER')
postgres_password = os.getenv('POSTGRES_PASSWORD')
postgres_db = os.getenv('POSTGRES_DB')
postgres_port = os.getenv('POSTGRES_PORT')


# SQLAlchemy setup
engine = create_engine(
    f'postgresql://{postgres_user}:{postgres_password}@host.docker.internal:{postgres_port}/{postgres_db}')

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{postgres_user}:{postgres_password}@host.docker.internal:{postgres_port}/{postgres_db}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Base(declarative_base):
    pass


class WorkflowRun(Base):
    __tablename__ = 'workflow_runs'
    id = Column(Integer, primary_key=True)
    repo_name = Column(String)
    workflow_name = Column(String)
    job_id = Column(String)
    run_id = Column(String)
    labels = Column(String)
    event_type = Column(String)
    created_at = Column(DateTime)


Session = sessionmaker(bind=engine)
session = Session()

Base.metadata.create_all(engine)

@app.route('/webhook', methods=['POST'])

def webhook():
    secret_token = os.getenv('GITHUB_WEBHOOK_SECRET')
    payload_body = request.get_data()
    signature_header = request.headers.get('x-hub-signature-256')
    signature_is_valid = verify_signature(payload_body, secret_token, signature_header)
    data = request.json  # Access JSON data directly

    if 'check_run_url' not in data['workflow_job']:
        return 'ERROR', 400

    run_url = data['workflow_job']['check_run_url']
    url = data['workflow_job']['url']
    job_id = url.split('/')[-1]
    run_id = data['workflow_job']['run_id']
    labels = data['workflow_job']['labels']
    event_type = data['workflow_job']['status']
    repo_name = data['repository']['full_name']
    workflow_name = data['workflow_job']['name']
    created_at = datetime.now()

    try:
        with session.begin():
            # Acquire a row-level lock on the table
            session.execute(text("LOCK TABLE workflow_runs IN EXCLUSIVE MODE").execution_options(autocommit=True))

            # Get the current maximum id value
            max_id = session.query(func.max(WorkflowRun.id)).scalar()
            if not max_id:
                max_id = 0

            # Increment the id by 1 for the new job
            new_id = max_id + 1

            # Create a new job without specifying the id
            new_run = WorkflowRun(repo_name=repo_name, workflow_name=workflow_name,
                                      event_type=event_type, created_at=created_at, job_id=job_id, run_id=run_id, labels=labels)
            session.add(new_run)
            session.flush()

            # Assign the id value to the object
            new_run.id = new_id

            session.commit()

        return 'OK', 200

    except exc.SQLAlchemyError as e:
        session.rollback()
        # Log the exception
        logging.error(f"An error occurred: {str(e)}")
        # Handle the exception
        return 'An error occurred', 500

    finally:
        session.close()

def verify_signature(payload_body, secret_token, signature_header):
    # Encode the payload body and secret token
    """Verify that the payload was sent from GitHub by validating SHA256.

    Raise and return 403 if not authorized.

    Args:
        payload_body: original request body to verify (request.get_data())
        secret_token: GitHub app webhook token (GITHUB_WEBHOOK_SECRET)
        signature_header: header received from GitHub (x-hub-signature-256)
    """
    if not signature_header:
        abort(403, 'x-hub-signature-256 header is missing!')
    hash_object = hmac.new(secret_token.encode('utf-8'), msg=payload_body, digestmod=hashlib.sha256)
    expected_signature = "sha256=" + hash_object.hexdigest()
    print("Expected Signature:", expected_signature)
    print("Received Signature:", signature_header)
    if not hmac.compare_digest(expected_signature, signature_header):
        abort(403, 'Request signatures didn\'t match!')

# Start API

class WorkflowRun(db.Model):
    __tablename__ = 'workflow_runs'

    id = db.Column(db.Integer, primary_key=True)
    repo_name = db.Column(db.String())
    created_at = db.Column(db.Integer())
    event_type = db.Column(db.String())
    workflow_name = db.Column(db.String())
    run_id = db.Column(db.String())
    job_id = db.Column(db.String())
    labels = db.Column(db.String())

    def __init__(self, repo_name, created_at, event_type, workflow_name, job_id, run_id, labels):
        self.repo_name = repo_name
        self.created_at = created_at
        self.event_type = event_type
        self.workflow_name = workflow_name
        self.job_id = job_id
        self.run_id = run_id
        self.labels = labels


@app.route('/workflow_runs')
def get_workflow_runs():
    query_params = request.args
    repo_name = query_params.get('repo_name')
    event_type = query_params.get('event_type')
    workflow_name = query_params.get('workflow_name')
    timestamp = query_params.get('created_at')
    run_id = query_params.get('run_id')
    labels = query_params.get('labels')

    workflow_runs = WorkflowRun.query
    if repo_name:
        workflow_runs = workflow_runs.filter_by(repo_name=repo_name)
    if event_type:
        workflow_runs = workflow_runs.filter_by(event_type=event_type)
    if timestamp:
        workflow_runs = workflow_runs.filter(
            WorkflowRun.created_at)

    workflow_runs = workflow_runs.all()

    result = []
    for workflow_run in workflow_runs:
        result.append({
            'id': workflow_run.id,
            'job_id': workflow_run.job_id,
            'workflow_name': workflow_run.workflow_name,
            'repo_name': workflow_run.repo_name,
            'timestamp': workflow_run.created_at,
            'status': workflow_run.event_type,
            'url': f"https://github.com/{workflow_run.repo_name}/actions/runs/{workflow_run.run_id}",
            'labels': workflow_run.labels
        })

    return jsonify(result)

@app.route('/queue')
def get_queue():
    query_params = request.args
    repo_name = query_params.get('repo_name')
    event_type = query_params.get('event_type')
    workflow_name = query_params.get('workflow_name')
    timestamp = query_params.get('created_at')
    run_id = query_params.get('run_id')
    id = query_params.get('id')
    job_id = query_params.get('job_id')

    workflow_runs = WorkflowRun.query
    if repo_name:
        workflow_runs = workflow_runs.filter_by(repo_name=repo_name)
    if event_type:
        workflow_runs = workflow_runs.filter_by(event_type=event_type)
    if timestamp:
        workflow_runs = workflow_runs.filter(WorkflowRun.created_at)

    twenty_minutes_ago = datetime.now() - timedelta(minutes=20)

    queues = WorkflowRun.query.filter(
        WorkflowRun.event_type == 'queued',
        WorkflowRun.job_id.notin_(
            WorkflowRun.query.with_entities(WorkflowRun.job_id).filter(
                WorkflowRun.event_type.in_(['in_progress', 'completed', 'waiting'])
            )
        ),
    ).all()

    result = []
    for queue in queues:
        waiting_for_20_minutes = queue.created_at < twenty_minutes_ago

        result.append({
            'id': queue.id,
            'job_id': queue.job_id,
            'workflow_name': queue.workflow_name,
            'repo_name': queue.repo_name,
            'timestamp': queue.created_at,
            'status': queue.event_type,
            'labels': queue.labels,
            'url': f"https://github.com/{queue.repo_name}/actions/runs/{queue.run_id}",
            'waiting_for_20_minutes': waiting_for_20_minutes
        })

    return jsonify(result)

@app.route('/in_progress')
def get_in_progress_jobs():
    # Fetch in-progress jobs from the endpoint
    response = requests.get('http://localhost:3100/workflow_runs')
    if response.status_code != 200:
        return 'Failed to fetch in-progress jobs', response.status_code

    jobs = response.json()

    # Filter out completed jobs and exclude queued jobs from the filtered jobs
    filtered_jobs = []
    completed_jobs = []
    completed_job_ids = set()

    for job in jobs:
        job_id = job['job_id']
        status = job['status']

        if status == 'completed':
          completed_job_ids.add(job_id)

    for job in jobs:
        job_id = job['job_id']
        status = job['status']


        if status == 'in_progress':
          if job_id not in completed_job_ids:
            filtered_jobs.append(job)
    # Return the filtered jobs
    return jsonify(filtered_jobs)

@app.route('/completed')
def get_completed_jobs():
    # Fetch in-progress jobs from the endpoint
    response = requests.get('http://localhost:3100/workflow_runs')
    if response.status_code != 200:
        return 'Failed to fetch completed jobs', response.status_code

    jobs = response.json()

    # Filter out completed jobs
    completed_jobs = []

    for job in jobs:
        status = job['status']

        if status == 'completed':
            completed_jobs.append(job)
    # Return the filtered jobs
    return jsonify(completed_jobs)

# Set request headers with authorization token
headers = {
    'Authorization': f'token {access_token}',
    'Accept': 'application/vnd.github.v3+json'
}

@app.route('/runners')
def get_runners():
    runnerUrl = f"https://api.github.com/orgs/{org_name}/actions/runners"
    response = requests.get(runnerUrl, headers=headers)

    if response.status_code != 200:
        print(
            f"Failed to get runners for organization {org_name}. Status code: {response.status_code}")
        exit()

    runners = response.json()

    result = []
    for runner in runners["runners"]:
        result.append({
            'name': runner['name'],
            'status': runner['status'],
            'id': runner['id'],
            'busy': runner['busy'],
            'labels': runner['labels']
        })

    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3100, debug=True)
