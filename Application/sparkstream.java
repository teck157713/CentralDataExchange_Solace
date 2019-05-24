package com.solacesystems.jms.samples;
import org.apache.log4j.Logger;
import org.apache.spark.storage.StorageLevel;
import org.apache.spark.streaming.receiver.Receiver;
import com.solacesystems.jms.SupportedProperty;
import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.Destination;
import javax.jms.ExceptionListener;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageConsumer;
import javax.jms.MessageListener;
import javax.jms.Session;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.util.Hashtable;

public class JMSReceiver extends Receiver<String> implements MessageListener{
    private static final long serialVersionUID = 1L;
    private static final String SOLJMS_INITIAL_CONTEXT_FACTORY = "com.solacesystems.jndi.SolJNDIInitialContextFactory";
    String jndiQueue_s;
    String connectionFactory_s;
    public JMSReceiver(String brokerURL, String vpn, String username, String password, String jndiQueue, String connectionFactory) throws NamingException {
        super(StorageLevel.MEMORY_ONLY_SER_2());
        Hashtable<String, String> env = new Hashtable<String, String>();
        env.put(InitialContext.INITIAL_CONTEXT_FACTORY, SOLJMS_INITIAL_CONTEXT_FACTORY);
        env.put(InitialContext.PROVIDER_URL, brokerURL);
        env.put(Context.SECURITY_PRINCIPAL, username);
        env.put(Context.SECURITY_CREDENTIALS, password);
        env.put(SupportedProperty.SOLACE_JMS_VPN, vpn);

        jndiQueue_s = jndiQueue;
        connectionFactory_s = connectionFactory;

    }

    @Override
    public void onStart(){
        InitialContext initialContext = null;
        try {
            ConnectionFactory factory = (ConnectionFactory) initialContext.lookup(connectionFactory_s);
            connection_s = factory.createConnection();
            Destination queue = (Destination) initialContext.lookup(jndiQueue_s);

            Session session = connection_s.createSession(false, Session.CLIENT_ACKNOWLEDGE);
            MessageConsumer consumer = session.createConsumer(queue);
            consumer.setMessageListener(this);
            connection_s.start();
        } catch (NamingException e) {
            e.printStackTrace();
        } catch (JMSException e){
            e.printStackTrace();
        }
    }

    @Override
    public void onStop(){
        try {
            connection_s.close();
        } catch (JMSException ex) {
            e.printStackTrace();
        }
    }

    @Override
    public void onMessage(Message msg){
        try {
            store(msg.toString());
            msg.acknowledge();
        } catch (JMSException e) {
            e.printStackTrace();
        }

    }

    @Override
    public String toString() {
        return "JMSReceiver Received ";
    }
}