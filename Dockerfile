# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 777 uploads

# Command to run the application
CMD ["npm", "start"]