# Stage 1 - the build process
FROM node:14-alpine as build-deps
WORKDIR /app
# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the app's source code to the container
COPY . .

# Build the React app
RUN npm run build

# Stage 2 - the production environment
FROM nginx:1.17-alpine

COPY --from=build-deps /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Define the command to start the app
ENTRYPOINT ["nginx", "-g", "daemon off;"]
