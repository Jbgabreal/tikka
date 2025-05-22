import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useState } from 'react';

function RenderTokenCreationResult({ result, prompt }) {
  const { sendTransaction, publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [txSignature, setTxSignature] = useState(null);
  const [signing, setSigning] = useState(false);
  if (!result) return null;
  if (result.signature || txSignature) {
    const signature = result.signature || txSignature;
    const explorer = result.explorer || (result.explorerTemplate ? result.explorerTemplate.replace('{signature}', signature) : null);
    return (
      <div className="chat-success">
        <div><strong>🎉 Token Created!</strong></div>
        <div><b>Mint:</b> <span style={{fontFamily: 'monospace'}}>{result.mint}</span></div>
        <div>
          <b>Transaction:</b>{' '}
          <a
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#4e9eff", textDecoration: "underline" }}
          >
            View on Solscan
          </a>
        </div>
      </div>
    );
  } else if (result.unsignedTransaction) {
    const handleSign = async () => {
      setSigning(true);
      try {
        if (!connected) {
          alert('Please connect your wallet to sign the transaction.');
          setSigning(false);
          return;
        }
        const txBuffer = Buffer.from(result.unsignedTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(txBuffer);
        const signature = await sendTransaction(transaction, connection);
        setTxSignature(signature);
      } catch (e) {
        alert('Failed to sign transaction: ' + e.message);
      }
      setSigning(false);
    };
    return (
      <div className="chat-sign-tx">
        <div>{prompt || "Please sign the transaction with your wallet to complete token creation and pay the Solana network fee."}</div>
        <button onClick={handleSign} disabled={signing} style={{marginLeft: 8}}>
          {signing ? 'Signing...' : 'Sign Transaction'}
        </button>
      </div>
    );
  }
  return null;
}

function ChatWindow({ messages }) {
  return (
    <div className="chat-window">
      {messages.map((message, idx) => (
        <div key={idx} className="chat-message-block">
          {/* Always show the backend prompt */}
          {message.prompt && <div className="chat-prompt">{message.prompt}</div>}
          {/* Show the sign button/Solscan link if result is present */}
          {message.result && <RenderTokenCreationResult result={message.result} prompt={message.prompt} />}
        </div>
      ))}
    </div>
  );
}

export default ChatWindow; 