# Watts-app Docker repository
This repository hosts the Docker images composing the services of the *Watts-app* demo application ([source code](https://github.com/lucsorel/watts-app)).

## Images and Dockerfiles
* `lucsorel/watts-app:webapp` ([Dockerfile](https://github.com/lucsorel/watts-app/blob/master/datamining/Dockerfile)): holds the **NodeJS/Express** application modelling the behavior of the factory & its devices (in reality, this would rather be another service handling connected sensors) and the web application monitoring the factory mean temperature
* `lucsorel/watts-app:datamining` ([Dockerfile](https://github.com/lucsorel/watts-app/blob/master/webapp/Dockerfile)): holds the **Python/Scikit-learn** application providing a linear regression service able to estimate the heat contribution of each factory device to the factory mean temperature

## Services interaction
These services interact over the Docker network with the super-light **ZeroMQ** messages broker via JSON messages.

## Install
The easiest way to get the whole application up-and-running it to use `docker-compose up`.
