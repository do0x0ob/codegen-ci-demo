import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConnectButton, useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { init } from './generated/hello_world/greeting';

// Replace with your actual package address
const PACKAGE_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000';

const greetingContract = init(PACKAGE_ADDRESS);

interface GreetingObject {
  id: string;
  message: string;
  owner: string;
}

function App() {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const [message, setMessage] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user's greeting objects
  const { data: greetings, isLoading, refetch } = useQuery({
    queryKey: ['greetings', account?.address],
    queryFn: async () => {
      if (!client || !account) return [];
      
      const objects = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ADDRESS}::greeting::Greeting`
        },
        options: {
          showContent: true
        }
      });

      return objects.data
        .filter(obj => obj.data?.content?.dataType === 'moveObject')
        .map(obj => {
          const content = obj.data!.content as any;
          return {
            id: content.fields.id.id,
            message: content.fields.message,
            owner: content.fields.owner
          } as GreetingObject;
        });
    },
    enabled: !!account && !!client,
    refetchInterval: 5000 // Refetch every 5 seconds
  });

  const handleCreateGreeting = async () => {
    if (!message.trim() || !account) return;
    
    setIsCreating(true);
    try {
      const tx = new Transaction();
      greetingContract.create_greeting({
        arguments: [message.trim()]
      })(tx);

      const result = await dAppKit.signAndExecuteTransaction({
        transaction: tx
      });

      if ('FailedTransaction' in result) {
        throw new Error('Transaction failed');
      }

      setMessage('');
      refetch();
      alert('Greeting created successfully!');
    } catch (error) {
      console.error('Error creating greeting:', error);
      alert('Failed to create greeting. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateGreeting = async (greetingId: string) => {
    if (!updateMessage.trim() || !account) return;
    
    setIsUpdating(true);
    try {
      const tx = new Transaction();
      greetingContract.update_message({
        arguments: [greetingId, updateMessage.trim()]
      })(tx);

      const result = await dAppKit.signAndExecuteTransaction({
        transaction: tx
      });

      if ('FailedTransaction' in result) {
        throw new Error('Transaction failed');
      }

      setUpdateMessage('');
      refetch();
      alert('Greeting updated successfully!');
    } catch (error) {
      console.error('Error updating greeting:', error);
      alert('Failed to update greeting. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            Hello World DApp
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#666',
            marginBottom: '2rem'
          }}>
            Create and manage your on-chain greetings
          </p>
          <ConnectButton />
        </header>

        {/* Main Content */}
        {account ? (
          <div>
            {/* Create Greeting Section */}
            <section style={{
              backgroundColor: '#f8f9fa',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '1px solid #e9ecef'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '1rem'
              }}>
                Create New Greeting
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your greeting message..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                onClick={handleCreateGreeting}
                disabled={!message.trim() || isCreating}
                style={{
                  backgroundColor: message.trim() && !isCreating ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  cursor: message.trim() && !isCreating ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                {isCreating ? 'Creating...' : 'Create Greeting'}
              </button>
            </section>

            {/* Greetings List */}
            <section>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '1rem'
              }}>
                Your Greetings
              </h2>

              {isLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666'
                }}>
                  Loading greetings...
                </div>
              ) : greetings && greetings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {greetings.map((greeting) => (
                    <div
                      key={greeting.id}
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e9ecef',
                        borderRadius: '12px',
                        padding: '1.5rem'
                      }}
                    >
                      <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{
                          fontSize: '1.2rem',
                          fontWeight: '500',
                          color: '#1a1a1a',
                          marginBottom: '0.5rem'
                        }}>
                          {greeting.message}
                        </h3>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#666',
                          margin: 0
                        }}>
                          ID: {greeting.id.slice(0, 20)}...
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <input
                          type="text"
                          value={updateMessage}
                          onChange={(e) => setUpdateMessage(e.target.value)}
                          placeholder="New message..."
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            fontSize: '0.9rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => handleUpdateGreeting(greeting.id)}
                          disabled={!updateMessage.trim() || isUpdating}
                          style={{
                            backgroundColor: updateMessage.trim() && !isUpdating ? '#28a745' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            borderRadius: '6px',
                            cursor: updateMessage.trim() && !isUpdating ? 'pointer' : 'not-allowed',
                            fontWeight: '500'
                          }}
                        >
                          {isUpdating ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    No greetings found
                  </p>
                  <p style={{ fontSize: '0.9rem' }}>
                    Create your first greeting above to get started!
                  </p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666'
          }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Welcome to Hello World DApp
            </p>
            <p style={{ fontSize: '1rem' }}>
              Please connect your wallet to create and manage your on-chain greetings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;