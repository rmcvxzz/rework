let nextUserId = 1;
const users = {};

function createUser(console_id) {
    if (!users[console_id]) {
        const id = nextUserId++;
        users[console_id] = {
            id,
            name: `Sackboy_${id}`
        };
    }
    return users[console_id];
}

function getUserById(id) {
    return Object.values(users).find(u => u.id == id);
}

function getAnyUser() {
    return Object.values(users)[0];
}

module.exports = {
    users,
    createUser,
    getUserById,
    getAnyUser
};