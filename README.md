# Public Transit Viewer

Viewer to interact with the [Public Transit Service](https://github.com/naviqore/public-transit-service).

The streamlit based Python app allows users to query connections between two stops or generate isolines from a specific
stop. The application supports the query parameters of the service to search specific connections or isoline.

## Installation

Get the current release from pypi and start the viewer:

```sh
pip install public-transit-viewer

export NAVIQORE_SERVICE_URL=<SERVER:PORT>
ptv-deploy
```

Or run the viewer inside a Docker container:

```sh
docker run -p 8501:8501 -e NAVIQORE_SERVICE_URL=<SERVER:PORT> ghcr.io/naviqore/public-transit-client:latest
```

Access the viewer on `http://localhost:8501`.

## Development

### Configuration

Create a `.env` file in the root directory. And add a line telling the application to which service host it should
connect. In Local Development this is typically a Java Spring service running on `http://localhost:8080`.

The required line in the `.env` file will then be: `NAVIQORE_SERVICE_URL=http://localhost:8080`

**Note**: you can also specify the `NAVIQORE_SERVICE_URL` in your operating system environment.

### Starting the App

To start the app in development mode run following command from the root directory:

```sh
poetry run streamlit run public_transit_viewer/connections.py
```

## License

This project is licensed under the MIT License - see
the [LICENSE](https://github.com/naviqore/public-transit-viewer/blob/main/LICENSE) file for details.
