# use this Dockerfile to build the image from the local source code with:
# docker build -t lucsorel/watts-app:datamining .
# run the container with:
# docker run -p 6969:6969 --name datamining -d lucsorel/watts-app:datamining
FROM lucsorel/zeromq-bindings:ubuntu15.10-zeromq4.1.x-scikit-learn0.17.x
MAINTAINER Luc Sorel

# installs the Python application
RUN mkdir -p /usr/local/data-mining
WORKDIR /usr/local/data-mining
COPY stream_analysis.py /usr/local/data-mining/

# exposes tcp ports
EXPOSE 6969

# starts the application
CMD [ "python", "stream_analysis.py" ]
