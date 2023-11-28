// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;
pragma solidity >=0.4.22 <0.9.0;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Election is ERC20 {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint8 age;
        string agenda;
        string gender;
        uint voteCount;
    }

    struct Voter {
        uint funds; 
        bool hasVoted;
    }

    event voteComplete (
        uint indexed _candidateId
    );
    event fundsTransferred (
        uint indexed _amount
    );

    // Read/write candidates
    mapping(uint => Candidate) public candidates;
    mapping(address => Voter) public voters;

    // Store Candidates Count
    uint public candidatesCount;
    address public owner;

    constructor() ERC20("Vote-Coin", "VC"){
        owner = msg.sender;
    }

    function addCandidate (string memory _name, uint8 _age, string memory _gender, string memory _agenda) public {
        require(msg.sender == owner, "Only owner can Add Candidates");
        candidatesCount ++;
        
        candidates[candidatesCount] = Candidate({
            id: candidatesCount,
            name: _name,
            age: _age,
            gender: _gender,
            agenda: _agenda,
            voteCount: 0
        });
    }

    function addFunds (uint _amount) public payable{
        _mint(msg.sender, _amount * (10 ** decimals()));
        voters[msg.sender].funds += _amount * (10 ** decimals());
        emit fundsTransferred(_amount);
    }

    function getBalanceVC() public view returns (uint){
        return voters[msg.sender].funds;
    }

    // function withdraw () public payable{

    //     _burn(msg.sender, msg.value * (10 ** decimals()));
    //     voters[msg.sender].funds -= msg.value * (10 ** decimals());

    //     emit fundsTransferred(msg.value);
    // }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender].hasVoted, "Current voter has already voted!");
        require(voters[msg.sender].funds > 0, "Current voter has no funds, please fund the campaign!");

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        voters[msg.sender].hasVoted = true;
        candidates[_candidateId].voteCount ++;
        
        // trigger voted event
        emit voteComplete(_candidateId);
    }
}