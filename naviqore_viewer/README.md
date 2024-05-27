# NAVIQORE Streamlit App

## Setup

### Configuration

Create a `.env` file in the root directory. And add a line telling the application to which service host it should connect. In Local Development this is typically a Java Spring service running on `http://localhost:8080`.

The required line in the `.env` file will then be: `NAVIQORE_HOST_URL=http://localhost:8080`

_Note: you can also specify the `NAVIQORE_HOST_URL` in your operating system environment._

### Install dependencies

This package comes with a Makefile that can be used to setup the project. To install and run the app, run the following commands in your terminal from the root directory (same directory as this README file): `make` or `make run`. This will create a virtual environment, install the required dependencies and start the app.
To only install the dependencies run `make install`. To reload everything you can run `make clean` and then run `make install` again.

## Starting the App

To start the app run following command in your terminal from the root directory: `streamlit run naviqore_viewer/main.py`. _Note: The virtual environment should be active in your terminal session before starting the app._

## Naviqore Client
For development purposes the dependency to the Naviqore Client is currently set as `develop=true` in the `pyproject.toml` file, this allows updating the local copy of Naviqore Client (same git repository) without having to re-install the package after every change (by means of symbolic links). A limitation however is that the IDE (at least Visual Studio Code) does not recognize the package in this configuration for linting, as a workaround the relative path has been added to the `.vscode/settings.json` file. This approach is hacky and needs to be undone, when the `naviqore_client` package becomes stable.
