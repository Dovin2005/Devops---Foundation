# UCC API Testing Guide

This README provides instructions for using the Postman collection and environment files for testing the UCC API endpoints across various microservices.

## Postman Collection

The Postman collection named **UCC API Collection** contains all the API endpoints for the UCC microservices. It is structured into folders based on the services.

### Collection Structure

- **Auth Service**
  - Login
- **Core Service**
  - Get Patient

You can add more endpoints as needed for other services following the same structure.

## Postman Environment

The **Local Environment** file contains environment variables that reference the values defined in the `.env` file. This allows you to easily switch between different environments (e.g., local, staging, production).

### Environment Variables

- **AUTH_URL**: URL for the Auth Service (default: `http://localhost:4001`)
- **CORE_URL**: URL for the Core Service (default: `http://localhost:4002`)
- **username**: Default username for testing (default: `testuser`)
- **password**: Default password for testing (default: `testpassword`)

## Usage Instructions

1. **Import the Collection**: Open Postman and import the `UCC-APIs.postman_collection.json` file.
2. **Set Up the Environment**: Import the `local.postman_environment.json` file into Postman and select it as the active environment.
3. **Run Tests**: You can now run the requests in the collection to test the API endpoints. Make sure your services are running locally as defined in the `docker-compose.yml`.

## Additional Notes

- Ensure that the `.env` file in the `apigateway-service` directory is correctly configured with the necessary environment variables.
- Modify the collection and environment files as needed to accommodate new endpoints or changes in service URLs.

This README will help you get started with testing the UCC API using Postman. Happy testing!