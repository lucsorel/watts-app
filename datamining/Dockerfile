# use this Dockerfile to build the image from the local source code with:
# docker build -t lucsorel/watts-app:datamining .
# run the container with:
# docker run -p 6969:6969 --name datamining -d lucsorel/watts-app:datamining
FROM ubuntu:15.10
MAINTAINER Luc Sorel

# installs the Python application
RUN mkdir -p /usr/local/data-mining
WORKDIR /usr/local/data-mining
COPY stream_analysis.py /usr/local/data-mining/

RUN apt-get update && apt-get install -y --no-install-recommends software-properties-common && \
    add-apt-repository -y ppa:chris-lea/zeromq && \
    add-apt-repository -y ppa:chris-lea/libpgm && \
    apt-get update && \
    apt-get install -y --no-install-recommends libzmq3 libzmq3-dev python python-dev make gcc g++ python-numpy python-scipy python-matplotlib ipython ipython-notebook python-pandas python-sympy python-nose && \
    apt-get install -y --no-install-recommends python-pip && \
    pip install -U pyzmq scikit-learn && \
    apt-get remove -y python-dev python-pip make gcc g++ && \
    apt-get autoremove -y

# exposes tcp ports
EXPOSE 6969

# starts the application
CMD [ "python", "stream_analysis.py" ]
