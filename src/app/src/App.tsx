import { useState } from 'react'
import { useCurrentAccount, useCurrentClient, useDAppKit, ConnectButton } from '@mysten/dapp-kit-react'
import { useQuery } from '@tanstack/react-query'
import { Transaction } from '@mysten/sui/transactions'
import { init } from './generated/hello_world/greeting'

// Replace with your actual package address
const PACKAGE_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000'

const greetingModule = init(PACKAGE_ADDRESS)

interface GreetingObject {
  id: string
  message: string
  owner: string
}

function App() {
  const account = useCurrentAccount()
  const client = useCurrentClient()
  const dAppKit = useDAppKit()
  
  const [newMessage, setNewMessage] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [selectedGreetingId, setSelectedGreetingId] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's greeting objects
  const { data: greetings, refetch, isLoading } = useQuery({
    queryKey: ['greetings', account?.address],
    queryFn: async () => {
      if (!account?.address) return []
      
      try {
        const response = await client.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${PACKAGE_ADDRESS}::greeting::Greeting`
          },
          options: {
            showContent: true,
            showType: true
          }
        })

        const greetings: GreetingObject[] = []
        for (const item of response.data) {
          if (item.data?.content && 'fields' in item.data.content) {
            const fields = item.data.content.fields as any
            greetings.push({
              id: item.data.objectId,
              message: fields.message,
              owner: fields.owner
            })
          }
        }
        return greetings
      } catch (err) {
        console.error('Error fetching greetings:', err)
        return []
      }
    },
    enabled: !!account?.address
  })

  const handleCreateGreeting = async () => {
    if (!newMessage.trim()) return
    
    setLoading('create')
    setError(null)
    
    try {
      const tx = new Transaction()
      greetingModule.create_greeting({
        arguments: [newMessage.trim()]
      })(tx)

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })
      
      if ('FailedTransaction' in result) {
        throw new Error(result.FailedTransaction.error || 'Transaction failed')
      }

      console.log('Greeting created:', result.Transaction.digest)
      setNewMessage('')
      refetch()
    } catch (err) {
      console.error('Error creating greeting:', err)
      setError(err instanceof Error ? err.message : 'Failed to create greeting')
    } finally {
      setLoading(null)
    }
  }

  const handleUpdateGreeting = async () => {
    if (!selectedGreetingId || !updateMessage.trim()) return
    
    setLoading('update')
    setError(null)
    
    try {
      const tx = new Transaction()
      greetingModule.update_message({
        arguments: [selectedGreetingId, updateMessage.trim()]
      })(tx)

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })
      
      if ('FailedTransaction' in result) {
        throw new Error(result.FailedTransaction.error || 'Transaction failed')
      }

      console.log('Greeting updated:', result.Transaction.digest)
      setUpdateMessage('')
      setSelectedGreetingId('')
      refetch()
    } catch (err) {
      console.error('Error updating greeting:', err)
      setError(err instanceof Error ? err.message : 'Failed to update greeting')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="App">
      <h1>Hello World DApp</h1>
      <p>A minimal Sui DApp for creating and managing greeting messages on-chain</p>

      <div className="card">
        <ConnectButton />
      </div>

      {account && (
        <>
          <div className="section">
            <div className="card">
              <h2>Create New Greeting</h2>
              <div className="input-group">
                <label htmlFor="newMessage">Your Greeting Message:</label>
                <input
                  id="newMessage"
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter your greeting message..."
                  disabled={loading === 'create'}
                />
              </div>
              <button
                className="primary"
                onClick={handleCreateGreeting}
                disabled={!newMessage.trim() || loading === 'create'}
              >
                {loading === 'create' ? 'Creating...' : 'Create Greeting'}
              </button>
            </div>
          </div>

          <div className="section">
            <div className="card">
              <h2>Your Greetings</h2>
              {isLoading ? (
                <p className="loading">Loading greetings...</p>
              ) : greetings && greetings.length > 0 ? (
                <div className="greetings-list">
                  {greetings.map((greeting) => (
                    <div key={greeting.id} className="greeting-item">
                      <h3>Greeting #{greeting.id.slice(-8)}</h3>
                      <div className="message">"{greeting.message}"</div>
                      <div className="owner">Owner: {greeting.owner}</div>
                      <div className="actions">
                        <button
                          onClick={() => {
                            setSelectedGreetingId(greeting.id)
                            setUpdateMessage(greeting.message)
                          }}
                          disabled={!!loading}
                        >
                          Update This Greeting
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No greetings found. Create your first greeting above!</p>
              )}
            </div>
          </div>

          {selectedGreetingId && (
            <div className="section">
              <div className="card">
                <h2>Update Greeting</h2>
                <p>Updating greeting: #{selectedGreetingId.slice(-8)}</p>
                <div className="input-group">
                  <label htmlFor="updateMessage">New Message:</label>
                  <input
                    id="updateMessage"
                    type="text"
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder="Enter new greeting message..."
                    disabled={loading === 'update'}
                  />
                </div>
                <div className="actions">
                  <button
                    className="success"
                    onClick={handleUpdateGreeting}
                    disabled={!updateMessage.trim() || loading === 'update'}
                  >
                    {loading === 'update' ? 'Updating...' : 'Update Greeting'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGreetingId('')
                      setUpdateMessage('')
                    }}
                    disabled={loading === 'update'}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}
        </>
      )}

      {!account && (
        <div className="card">
          <p>Connect your wallet to start creating and managing greetings!</p>
        </div>
      )}
    </div>
  )
}

export default App