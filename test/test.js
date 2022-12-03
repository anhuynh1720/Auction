let Auction = artifacts.require('./Auction.sol');

let auctionInstance;

contract('AuctionContract', function(accounts) {

  //accounts[0] is the default account

  describe('Contract deployment', function() {

    it('Contract deployment', function() {
      //Fetching the contract instance of our smart contract
      return Auction.deployed().then(function(instance) {
        //We save the instance in a global variable and all smart contract functions are called using this
        auctionInstance = instance;
        assert(auctionInstance !== undefined, 'Auction contract should be defined');
      });
    });

    it('Initial rule with corrected startingPrice and minimumStep', function() {

      //Fetching the rule of Auction

      return auctionInstance.rule().then(function(rule) {
        //We save the instance in a global variable and all smart contract functions are called using this
        assert(rule !== undefined, 'Rule should be defined');
        assert.equal(rule.startingPrice, 50, 'Starting price should be 50');
        assert.equal(rule.minimumStep, 5, 'Minimum step should be 5');
      });
    });
  });

    describe('Register', () => {
        it('Should only allow auctioneer to register bidders', () => {
            return auctionInstance.register('0x2f9982a486291995e45edca8a014583a0234d6ef', '100', {from: accounts[1]}).then(() => {
                throw('Failed to check owner in register');
            }).catch((e) => {
                if (e === 'Failed to check owner in register') {
                    assert(false);
                } else {
                    assert(true);
                }
            });
        })

        it('Should only allow auctioneer to register during CREATED state', () => {
            return auctionInstance.register('0x2f9982a486291995e45edca8a014583a0234d6ef', '100', {from: accounts[0]}).then(() => {
                return auctionInstance.register('0x8bb62de66fb3069a90656a73c47b3997caf65a53', '100', {from: accounts[0]}).then(() => {
                    return auctionInstance.state()}).then((state) => {
                    assert.equal(state, 0, 'Current state is CREATED')
                })
            })
        })

        it('Should enter address and number of tokens when register', () => {
            return auctionInstance.register().then(() => {
                throw('Failed to pass argument');
                }).catch((e) => {
                    if (e === 'Failed to pass argument') {
                        assert(false);
                    } else {
                        assert(true);
                    }
                })
        })
    })

    describe('Start Session', () => {
        it('Should only allow auctioneer to start session', () => {
            return auctionInstance.startSession({from: accounts[1]}).then(() => {
                throw('Failed to check owner in start session');
                }).catch((e) => {
                    if (e === 'Failed to check owner in start session') {
                        assert(false);
                    } else {
                        assert(true);
                    }
                })
        })

        it('Should only allow auctioneer to start session during CREATED state', () => {
            return auctionInstance.state().then((state) => {
                return auctionInstance.startSession({from: accounts[0]}).then(() => {
                    //The state before the session start is CREATED
                    assert.equal(state, 0, 'Current state is CREATED');
                })
            })
        })
    })

    describe('Bid', () => {
        it('Should allow all bidders to bid', () => {
            return auctionInstance.bid(60, {from: accounts[1]}).then(() => {
                return auctionInstance.bid(70, {from: accounts[2]}).then(() => {
                    //If 2 above bidders have bidded successfully, this block will be executed
                    assert(true);
                }).catch(() => {
                    assert(false);
                })
            })
        })

        it('Should only allow bidders to bid during STARTED state', () => {
            return auctionInstance.state().then((state) => {
                return auctionInstance.bid(75, {from: accounts[1]}).then(() => {
                    assert.equal(state, 1, 'Current state is Started');
                })
            })
        })

        it('Should pass price for the next step as an argument', () => {
            return auctionInstance.bid().then(() => {
                throw 'Invalid number of parameters for "bid"';
            }).catch((e) => {
                if (e === 'Invalid number of parameters for "bid"') {
                    assert(false);
                } else {
                    //This block of code will be executed when there is no arugment passed to bid
                    assert(true);
                }
            })
        })

        it('The number of tokens which the next bidder bid must be higher than the current winner', () => {
            return auctionInstance.bid(70, {from: accounts[2]}).then(() => {
                throw 'Not enough token';
            }).catch((e) => {
                if (e === 'Not enough token') {
                    assert(false);
                } else {
                    //This block of code will be executed when there is not enough token
                    assert(true);
                }
            })
        })
    })

    describe('Announce', () => {
        it('Should only allow auctioneer to announce auction result', () => {
            return auctionInstance.announce({from: accounts[1]}).then(() => {
                throw('Failed to check owner in auction result');
                }).catch((e) => {
                    if (e === 'Failed to check owner in auction result') {
                            assert(false);
                    } else {
                            assert(true);
                    }
                })
        })

        it('Should only allow auctioneer to announce auction result during STARTED state and after calling announce 4 times, the state must be CLOSING', () => {
                return auctionInstance.state().then((stateStarted) => {
                    //The state before calling announce must be started
                    assert.equal(stateStarted, 1, 'Current state is STARTED');
                    return auctionInstance.announce({from: accounts[0]}).then(() => {
                        return auctionInstance.announce({from: accounts[0]}).then(() => {
                            return auctionInstance.announce({from: accounts[0]}).then(() => {
                                return auctionInstance.announce({from: accounts[0]}).then(() => {
                                    return auctionInstance.state().then((stateClosing) => {
                                        //The state after calling announce 4 times must be closing
                                        assert.equal(stateClosing, 2, 'Current state is CLOSING');
                                })
                            })
                        })
                    })
                })
            })
        })
    })

    describe('Return token to all bidders except the winner', () => {
        it('Should allow all bidders get the bidded token back and this action is only available during closing state', () => {
            return auctionInstance.state().then((state) => {
                assert.equal(state, 2)
                return auctionInstance.getDeposit({from: accounts[2]}).then(() => {
                    return auctionInstance.bidders('0x8bb62de66fb3069a90656a73c47b3997caf65a53').then((bidder) => {
                        //Token of the bidder who have lost the auction will be returned
                        assert.equal(bidder.token, 100)
                    })
                })
            })
        })
    })
});