pragma solidity ^0.5.0;

contract POE {
    struct Notarization {
        bytes32 hash;
        uint time;
    }
    mapping (string => Notarization) notarizations;

    function addHash(string memory _id, bytes32 _hash) public {
        require(notarizations[_id].hash == bytes32(0), "Nolla");
        notarizations[_id].hash = _hash;
        notarizations[_id].time = block.timestamp;
    }

    function getHash(string memory _id) public view returns(bytes32) {
        require(notarizations[_id].hash != bytes32(0), "Nolla");
        return notarizations[_id].hash;
    }

    function getTimestamp(string memory _id) public view returns(uint) {
        return notarizations[_id].time;
    }
}
