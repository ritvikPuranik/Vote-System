App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  contractInstance: null,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();
      return App.render();
    });
  },

  isOwner: async() =>{
    const owner = await App.contractInstance.owner();
    console.log("owner od contract>>", owner);
    if(App.account !== owner){
      console.log("This account is not owner");
      document.getElementById("add-candidate").style.display = "none";
    }else{
      document.getElementById("add-candidate").style.display = "block";
    }
  },

  render: async() => {
    // Load contract data
    let instance = await App.contracts.Election.deployed();
    App.contractInstance = instance;

    var loader = $("#loader");
    var content = $("#content");
    
    loader.show();
    content.hide();
    
    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        
      }
    });
    await window.ethereum.enable();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    App.account = accounts[0];
    $("#accountAddress").html("Your Account: " + App.account);
    await App.isOwner();
    window.ethereum.on('accountsChanged', async function (accounts) {
      App.account = accounts[0];
      $("#accountAddress").html("Your Account: " + App.account);
      await App.isOwner();
    });

    
  
    try{
      let candidatesCount = await instance.candidatesCount();
  
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();
  
      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();
  
      console.log("candidatesCount>>", candidatesCount.c[0]);
      for (var i = 1; i <= candidatesCount.c[0]; i++) {
        let candidate = await instance.candidates(i);
        var id = candidate[0];
        var name = candidate[1];
        var voteCount = candidate[2];
        
        // Render candidate Result
        var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
        candidatesResults.append(candidateTemplate)
  
        // Render candidate ballot option
        var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        candidatesSelect.append(candidateOption);
      }
      console.log("app account>", App.account);
      
      let hasVoted = await instance.voters(App.account);
       // Do not allow a user to vote
       if(hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();

    }catch(err){
      console.log("error while rendering>>",err);
    }

  },

  addCandidate: async() =>{
    let contractInstance = App.contractInstance;
    console.log("contract instnce from addcandidate>", contractInstance);
    let name = prompt("Enter Candidate Name");
    try{
      await contractInstance.addCandidate(name, {from: App.account});
    }catch(err){
      console.log("error while adding new candidate>>", err);
    }
    await App.render();

  },

  castVote: async () =>{
    var candidateId = $('#candidatesSelect').val();
    await App.contractInstance.vote(candidateId, {from: App.account});
    
    // Wait for votes to update
    $("#content").hide();
    $("#loader").show();
  },

  listenForEvents: async()  =>{
    let contractInstance = App.contractInstance;
    contractInstance.votedEvent({}, {
      fromBlock: 'latest',
      toBlock: 'latest'
    }).watch(function(error, event) {
      console.log("event triggered", event)
      // Reload when a new vote is recorded
      App.render();
    });

  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});