const server = require('./server')
const supertest = require('supertest')

//TESTING RETURN OF /ALL AFTER ASYNC OP
describe("GET /all", function() {
    it("should return a 200 OK", async function() {
      const result = await server.results;
      if(result) {
      return supertest(server)
        .get("/all")
        .then(res => {
          expect(res.status).toBe(200);
        });
      };
    });
});
// TESTING RETURN OF /COMEDIANS AFTER ASYNC OP
describe("GET /comedians", function() {
    it('should return 200 OK', async function() {
        const names = await server.names
        if(names) {
            return supertest(server)
            .get("/comedians")
            .then((res) => {
                expect(res.status).toBe(200)
            });
        };
    });
});