# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the app dependencies
RUN npm install
RUN npm install -g serve

# Copy the app's source code to the container
COPY . .

# Build the React app
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Define the command to start the app
CMD ["sh", "-c", "REACT_APP_BACKEND_BASE_URL=$BACKEND_BASE_URL serve -s build"]
