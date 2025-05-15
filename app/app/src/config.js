const config = {
    apiPath: 'http://localhost:3001',
    headers: () => {
        return {
            headers: {
                Authorization: localStorage.getItem("token"),
            },
        };
    },
};

export default config;

// apiPath: 'http://139.180.135.229:3001', ต่อขึ้นเว็บ
// apiPath: 'http://localhost:3001', ต่อในเครื่อง
