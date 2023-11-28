App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  contractInstance: null,
  userFunds: 0,

  init: ()  =>{
    return App.initWeb3();
  },

  initWeb3: () =>{
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

  initContract: () =>{
    $.getJSON("Election.json", (election) => {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

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
    var loader = $("#loader");
    var content = $("#content");
    
    loader.show();
    content.hide();

    // Load contract data
    let instance = await App.contracts.Election.deployed();
    App.contractInstance = instance;
    console.log("contractinstance>", instance);
    
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
        var age = candidate[2];
        var agenda = candidate[3];
        var gender = candidate[4];
        var voteCount = candidate[5];
        
        // Render candidate Result
        var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + age+", "+gender + "</td><td>" + agenda + "</td><td>" + voteCount + "</td></tr>";
        candidatesResults.append(candidateTemplate)
  
        // Render candidate ballot option
        var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        candidatesSelect.append(candidateOption);
      }
      console.log("app account>", App.account);
      
      let hasVoted = await instance.voters(App.account);
      console.log("HAS voted>>", hasVoted[1]);
       // Do not allow a user to vote
       if(hasVoted[1]) {
        $('form').hide();
      }
      loader.hide();
      content.show();

    }catch(err){
      console.log("error while rendering>>",err);
    }

  },

  addCandidate: async(details) =>{
    let {name, age, gender, agenda} = details;
    App.listenForEvents();

    let contractInstance = App.contractInstance;
    console.log("contract instnce from addcandidate>", contractInstance);
    // let name = prompt("Enter Candidate Name");
    try{
      await contractInstance.addCandidate(name, age, gender, agenda, {from: App.account});
    }catch(err){
      console.log("error while adding new candidate>>", err);
    }
    // await App.render();

  },

  castVote: async () =>{
    var candidateId = $('#candidatesSelect').val();
    await App.contractInstance.vote(candidateId, {from: App.account});
    
    // Wait for votes to update
    $("#content").hide();
    $("#loader").show();
  },

  addFunds: async() =>{
    const web3Utils = require('web3-utils');
    web3 = new Web3(App.web3Provider);
    console.log("web3>", web3Utils);
    // console.log("utils>", web3.utils);
    let amount = prompt("Enter amount to deposit(ether)", "10");
    // await App.contractInstance.addFunds(amount, {from: App.account});
    let myVoter = await App.contractInstance.voters(App.account);
    App.userFunds = myVoter.funds / (10 ** 18);
    
    // App.userFunds = web3.utils.fromWei(myVoter.funds, "ether");
    console.log("user funds updatd to >>", App.userFunds);
  },

  listenForEvents: async()  =>{
    let contractInstance = App.contractInstance;
    console.log("voted event>>", contractInstance);
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

$(() => {
  $(window).load(() =>{
    // if(window.location.pathname === "/"){
    //   App.init();
    // }
    App.init();
  });
});