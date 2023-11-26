// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    event votedEvent (
        uint indexed _candidateId
    );

    // Read/write candidates
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;

    // Store Candidates Count
    uint public candidatesCount;
    address public owner;

    constructor(){
        owner = msg.sender;
    }

    function addCandidate (string memory _name) public {
        require(msg.sender == owner);
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount ++;
        
        // trigger voted event
        emit votedEvent(_candidateId);
    }
}