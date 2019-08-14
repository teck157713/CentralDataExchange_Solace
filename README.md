# Demo: Central Exchange Broker

## What is the issue?
In large organisations there are multiple agencies who may collect and utilise different data streams. The sharing of these data streams between different agecies may be useful to an organisation in meeting various operating need of each of its agencies. In addition the project should be able to showcase the abilities of Solace, in providing a central data exchange that can be utilised by other users (“agencies”) to share, monitor and consume data.

An example use case, in the context of a smart city, is the exchange of data between different government agencies. Agencies can share the data that they collect via the central exchange in real time (eg. CCTV footage, sensor data) and can further utilise data that is shared to them by other agencies. A Machine Learning or Analytics application can also be subscribed to the events being published by agencies.

## How do we solve it?
![Main Structure](https://github.com/teck157713/presalesprototype/blob/master/Application/image/example.jpg)

We came up with a front facing JavaScript web application that utilises the Solace Javascript API and various SEMP calls to, create bridges between the central exchange broker and the agency broker.

This allow agencies to view event streams available to them from other agencies, as well as to publish events that can be accessed by other agencies, the access control for this publishing and subscribing will be centrally managed via Access Control Lists on the Central Exchange broker.

The administrator of the central exchange broker, also has the flexibility to accept or deny requests from existing agency brokers to publish new events on to the central broker. The administrator can also use registration details provided by agencies, who wish to connect to the central brokers to establish bridges through the user interface. All this creation of new ACL topic allowance and bridge connections are executed on the backend via a SEMP API call.


## Resources
For more information try these resources:
- Get a better understanding of Solace technology (https://docs.solace.com/All-Docs.htm).
- Check out the Solace blog (https://solace.com/blog/) for other interesting discussions around Solace technology.
- Read the project set-up guide here (https://solace.com/blog/)
