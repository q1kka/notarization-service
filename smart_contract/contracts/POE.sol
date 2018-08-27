pragma solidity ^0.4.24;

contract POE {
    struct Notorization {
        bytes32 hash;
        uint time;
    }
    mapping (string => Notorization) notorizations;

    function addHash(string _id, bytes32 _hash) public {
        require(notorizations[_id].hash == bytes32(0), "Nolla");
        notorizations[_id].hash = _hash;
        notorizations[_id].time = block.timestamp;
    }

    function getHash(string _id) public view returns(bytes32) {
        return notorizations[_id].hash;
    }

    function getTimestamp(string _id) public view returns(uint) {
        return notorizations[_id].time;
    }
}
