FROM node:20-alpine

# Define the working directory inside the container
WORKDIR /usr/src/backend

# COpy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose the port that the application will run on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:dev"]