from flask import Flask, request, jsonify, abort, current_app
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
postgres_host = os.getenv('POSTGRES_HOST')

logging.basicConfig(level=logging.INFO, format='%(message)s')

# SQLAlchemy setup
engine = create_engine(
    f'postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}')

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}'
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

    def to_dict(self):
        return {
            'id': self.id,
            'repo_name': self.repo_name,
            'created_at': self.created_at,
            'event_type': self.event_type,
            'workflow_name': self.workflow_name,
            'run_id': self.run_id,
            'job_id': self.job_id,
            'labels': self.labels
        }

@app.route('/workflows-completed-count', methods=['GET'])
def get_workflow_completed():
    try:
        # Execute the SQL query to fetch the workflow summary
        query = text("""
        SELECT workflow_name, COUNT(*) AS num_completed_workflows
        FROM workflow_runs
        WHERE event_type = 'completed'
        GROUP BY workflow_name ORDER BY num_completed_workflows DESC
        """)
        result = db.session.execute(query)

        # Convert the query result to a list of dictionaries
        workflow_summary = [
            {
                'workflow_name': row[0],
                'num_workflows': row[1]
            }
            for row in result
        ]

        # Return the workflow summary as JSON response
        return jsonify(workflow_summary)

    except Exception as e:
        # Handle the exception
        return str(e), 500

@app.route('/workflows-completed-count-by-repo', methods=['GET'])
def get_workflow_completed_by_repo():
    try:
        # Execute the SQL query to fetch the workflow summary
        query = text("""
        SELECT repo_name, COUNT(*) AS num_completed_jobs
        FROM workflow_runs
        WHERE event_type = 'completed'
        GROUP BY repo_name ORDER BY num_completed_jobs DESC
        """)
        result = db.session.execute(query)

        # Convert the query result to a list of dictionaries
        workflow_summary = [
            {
                'repo_name': row[0],
                'num_workflows': row[1]
            }
            for row in result
        ]

        # Return the workflow summary as JSON response
        return jsonify(workflow_summary)

    except Exception as e:
        # Handle the exception
        return str(e), 500

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

@app.route('/update-workflow-status', methods=['POST'])
def check_workflow_status():
    subquery_completed = db.session.query(WorkflowRun.job_id).filter(
        WorkflowRun.event_type == 'completed'
    )
    subquery_waiting = db.session.query(WorkflowRun.job_id).filter(
        WorkflowRun.event_type == 'waiting'
    )
    subquery_in_progress = db.session.query(WorkflowRun.job_id).filter(
        WorkflowRun.event_type == 'in_progress'
    )

    queued_workflows = []
    in_progress_workflows = []

    repo_names = db.session.query(WorkflowRun.repo_name).distinct().all()
    for repo_name in repo_names:
        repo_name = repo_name[0]
        queued = WorkflowRun.query.filter(
            WorkflowRun.repo_name == repo_name,
            WorkflowRun.event_type == 'queued',
            WorkflowRun.job_id.notin_(subquery_completed),
            WorkflowRun.job_id.notin_(subquery_waiting),
            WorkflowRun.job_id.notin_(subquery_in_progress)
        ).all()

        in_progress = WorkflowRun.query.filter(
            WorkflowRun.repo_name == repo_name,
            WorkflowRun.event_type == 'in_progress',
            WorkflowRun.job_id.notin_(subquery_completed),
            WorkflowRun.job_id.notin_(subquery_waiting)
        ).all()

        queued_workflows.extend(queued)
        in_progress_workflows.extend(in_progress)

    logger = logging.getLogger('workflow-status')
    log_messages = []
# Iterate over queued workflows
    for workflow in queued_workflows:
        repo_name = workflow.repo_name
        job_id = workflow.job_id

        # Make the GitHub API request to get the current status of the job
        github_api_url = f'https://api.github.com/repos/{repo_name}/actions/jobs/{job_id}'
        headers = {
            'Accept': 'application/vnd.github+json',
            'Authorization': f'Bearer {access_token}',
            'X-GitHub-Api-Version': '2022-11-28'
        }
        response = requests.get(github_api_url, headers=headers)

        if response.status_code == 200:
            # Parse the response and extract the current status
            job_data = response.json()
            current_status = job_data.get('status')

            # Check if the current status is different from the existing status in the database
            if workflow.event_type != current_status:
                # Create a new entry with the current status
                new_workflow = WorkflowRun(
                    repo_name=workflow.repo_name,
                    created_at=workflow.created_at,
                    event_type=current_status,
                    workflow_name=workflow.workflow_name,
                    job_id=workflow.job_id,
                    run_id=workflow.run_id,
                    labels=workflow.labels
                )
                db.session.add(new_workflow)
                db.session.commit()

                # Log an update for the job
                update_message = f'Updated job {job_id} in repository {repo_name} with status {current_status}'
                log_messages.append(update_message)
                logger.info(update_message)

    if not queued_workflows:
        no_updates_message = 'No queued job updates found.'
        log_messages.append(no_updates_message)
        logger.info(no_updates_message)

    # Iterate over in-progress workflows
    for workflow in in_progress_workflows:
        repo_name = workflow.repo_name
        job_id = workflow.job_id

        # Make the GitHub API request to get the current status of the job
        github_api_url = f'https://api.github.com/repos/{repo_name}/actions/jobs/{job_id}'
        headers = {
            'Accept': 'application/vnd.github+json',
            'Authorization': f'Bearer {access_token}',
            'X-GitHub-Api-Version': '2022-11-28'
        }
        response = requests.get(github_api_url, headers=headers)

        if response.status_code == 200:
            # Parse the response and extract the current status
            job_data = response.json()
            current_status = job_data.get('status')

            # Check if the current status is different from the existing status in the database
            if workflow.event_type != current_status:
                # Create a new entry with the current status
                new_workflow = WorkflowRun(
                    repo_name=workflow.repo_name,
                    created_at=workflow.created_at,
                    event_type=current_status,
                    workflow_name=workflow.workflow_name,
                    job_id=workflow.job_id,
                    run_id=workflow.run_id,
                    labels=workflow.labels
                )
                db.session.add(new_workflow)
                db.session.commit()

                # Log an update for the job
                update_message = f'Updated job {job_id} in repository {repo_name} with status {current_status}'
                log_messages.append(update_message)
                logger.info(update_message)

    if not in_progress_workflows:
        no_updates_message = 'No in progress job updates found.'
        log_messages.append(no_updates_message)
        logger.info(no_updates_message)


    queued_data = [
        workflow.to_dict()
        for workflow in queued_workflows
    ]

    in_progress_data = [
        workflow.to_dict()
        for workflow in in_progress_workflows
    ]

    return jsonify({
        'queued_count': len(queued_workflows),
        'queued_workflows': queued_data,
        'in_progress_count': len(in_progress_workflows),
        'in_progress_workflows': in_progress_data,
        'log_messages': log_messages
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3100, debug=True)
