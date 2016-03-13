# Webapp Docker image and container
* build the `webapp` Docker image with (as `root` user):
```bash
sudo su
cd watts-app/webapp
# builds the image
docker build -t files/watts-app-webapp .
# deletes the image
docker rmi files/watts-app-webapp
```

* runs the image in a container (exposes the http port)

```bash
# launches the container (the stop command must be run from another terminal)
docker run -p 3030:3030 --name webapp files/watts-app-webapp

# runs the container in daemon mode
docker run -p 3030:3030 --name webapp -d files/watts-app-webapp
```

* view the container logs
```bash
docker ps
docker logs webapp
```

* stops and removes the container
```bash
docker stop webapp
docker rm webapp
```
