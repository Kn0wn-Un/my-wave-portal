import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {
	const [currentAccount, setCurrentAccount] = useState('');
  const [allWaves, setAllWaves] = useState([]);
	const [userWaves, setUserWaves] = useState(0);
  const [waving, setWaving] = useState(false);
  const [animation, setAnimation] = useState('');
  const [waveMessage, setWaveMessage] = useState('');
	const contractAddress = '0xa6aAa39B81317F1371273c9Ff7beae5665882413';
	const contractABI = abi.abi;
	const checkIfWalletIsConnected = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log('Make sure you have metamask!');
				return;
			} else {
				console.log('We have the ethereum object', ethereum);
			}

			/*
			 * Check if we're authorized to access the user's wallet
			 */
			const accounts = await ethereum.request({ method: 'eth_accounts' });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log('Found an authorized account:', account);
				setCurrentAccount(account);
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);
				let uw = await wavePortalContract.getUserWaves();
				setUserWaves(uw.toNumber());
			} else {
				console.log('No authorized account found');
			}
		} catch (error) {
			console.log(error);
		}
	};
	/**
	 * Implement your connectWallet method here
	 */
	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert('Get MetaMask!');
				return;
			}

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			console.log('Connected', accounts[0]);
			setCurrentAccount(accounts[0]);
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const wavePortalContract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer
			);
			let uw = await wavePortalContract.getUserWaves();
			setUserWaves(uw.toNumber());
		} catch (error) {
			console.log(error);
		}
	};

	const wave = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				let count = await wavePortalContract.getTotalWaves();
				console.log('Retrieved total wave count...', count.toNumber());

				const waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 });
				console.log('Mining...', waveTxn.hash);
        setWaving(true);

				await waveTxn.wait();
				console.log('Mined -- ', waveTxn.hash);
        setWaving(false);
        setWaveMessage('');
        setAnimation('thanks');
        setTimeout(()=>{
          setAnimation('');
        }, 5000);

				count = await wavePortalContract.getTotalWaves();
				console.log('Retrieved total wave count...', count.toNumber());
				let uw = await wavePortalContract.getUserWaves();
				setUserWaves(uw.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();
        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);

         /**
         * Listen in for emitter events!
         */
        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

	/*
	 * This runs our function when the page loads.
	 */
	useEffect(() => {
		checkIfWalletIsConnected();
    getAllWaves();
	}, []);


	return (
		<div className="mainContainer">
			<div className="dataContainer">
				<div className="header">👋 Hey there!</div>

				<div className="bio">
					I am Darshan, it's nice to meet you! Connect your Ethereum wallet and
					wave at me! (Dayammm... this is cool)
				</div>
        <input type="text" value={waveMessage} onChange={(e)=>{setWaveMessage(e.target.value)}}  maxLength="100" placeholder="say something here" />

				{waving ? (
          <button className="waveButton" onClick={wave} disabled>
					Waving...
				  </button>
        ) : (<button className="waveButton" onClick={wave}>
					Wave at Me
				</button>)}

				{!userWaves ? (
					''
				) : (
					<div>
						<div className="bio">
							User {currentAccount} you have waved at me
							<span className={animation}>🎉{userWaves} times!🎉</span>
							<br />
						</div>
						<h3 className={`thank-you ${animation}`}>Thank You!</h3>
					</div>
				)}
				{/*
				 * If there is no currentAccount render this button
				 */}
				{!currentAccount && (
					<button className="waveButton" onClick={connectWallet}>
						Connect Wallet
					</button>
				)}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
			</div>
		</div>
	);
}
