const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  //#1
  test("Creating an issue with every field", (done) => {
    chai.request('http://localhost:3000')
        .keepOpen()
        .post('/api/issues/apitest')
        .send({
            issue_title: "Fix auth",
            issue_text: "User auth is not working.",
            created_by: "Mike",
            assigned_to: "Joe",
            open: true,
            status_text: "Not yet started"
        })
        .end((err, res) => {
            assert.equal(res.status, 200, "Status should be 200 (OK)");
            assert.include(res.body, {
            issue_title: "Fix auth",
            issue_text: "User auth is not working.",
            created_by: "Mike",
            assigned_to: "Joe",
            open: true,
            status_text: "Not yet started"
            }, "API should respond with data exactly as inputted");
            assert.property(res.body, '_id', 'Response should include _id');
            assert.property(res.body, 'created_on', 'Response should include created_on');
            assert.property(res.body, 'updated_on', 'Response should include updated_on');
            done();
        })
  })
  //#2
  test("Creating an issue with only required fields", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .post('/api/issues/apitest')
    .send({
        issue_title: "Optimize code",
        issue_text: "Our current code is not efficient.",
        created_by: "Alan"
    })
    .end((err, res) => {
        assert.equal(res.status, 200, "Status should be 200 (OK)");
        assert.include(res.body, {
        issue_title: "Optimize code",
        issue_text: "Our current code is not efficient.",
        created_by: "Alan",
        assigned_to: "",
        open: true,
        status_text: ""
        }, "API should respond with data as inputted and with blanks for optional fields not filled in");
        assert.property(res.body, '_id', 'Response should include _id');
        assert.property(res.body, 'created_on', 'Response should include created_on');
        assert.property(res.body, 'updated_on', 'Response should include updated_on');
        done();
    })
  })
  //#3
  test("Creating an issue with missing required fields", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .post('/api/issues/apitest')
    .send({
        issue_title: "",
        issue_text: "",
        created_by: "",
        assigned_to: 'this should fail',
        status_text: 'due to missing required fields'
    })
    .end((err, res) => {
        assert.equal(res.status, 200, "Status should be 200 (OK)");
        assert.deepEqual(res.body, {error: "required field(s) missing"}, "API should return required field missing error if required fields are not filled in");
        done();
    })
  })
  //#4
  test("View issues on a project", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .get('/api/issues/apitest')
    .end((err, res) => {
        assert.equal(res.status, 200, "Status should be 200 (OK)");
        assert.typeOf(res.body, 'array', "API should respond with an array");
        for (let i = 0; i < res.body.length; i++) {
            assert.property(res.body[i], 'issue_title', 'Response should include _id');
            assert.property(res.body[i], 'issue_text', 'Response should include created_on');
            assert.property(res.body[i], 'created_by', 'Response should include updated_on');
            assert.property(res.body[i], 'assigned_to', 'Response should include assigned_to');
            assert.property(res.body[i], 'open', 'Response should include open');
            assert.property(res.body[i], 'status_text', 'Response should include status_text');
            assert.property(res.body[i], '_id', 'Response should include _id');
            assert.property(res.body[i], 'created_on', 'Response should include created_on');
            assert.property(res.body[i], 'updated_on', 'Response should include updated_on');
        }
        done();
    })
  })
  //#5
  test("View issues on a project with one filter", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .get('/api/issues/apitest?created_by=Mike')
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.typeOf(res.body, 'array', 'API should respond with an array');
        for (let i = 0; i < res.body.length; i++) {
            assert.equal(res.body[i].created_by, 'Mike', 'Query should only return issues created by Mike');
        }
        done();
    })
  })
  //#6
  test("View issues on a project with multiple filters", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .get('/api/issues/apitest/?created_by=Mike&open=false&assigned_to=Joe')
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.typeOf(res.body, 'array', 'API should respond with an array');
        for (let i = 0; i < res.body.length; i++) {
            assert.equal(res.body[i].created_by, 'Mike', 'Query should only return issues created by Mike');
            assert.strictEqual(res.body[i].open, false, 'Query should only return issues that are closed (false)');
            assert.equal(res.body[i].assigned_to, 'Joe', 'Query should only return issues assigned to Joe');
        }
        done();
    })
  })
  //#7
  test("Update one field on an issue", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .put('/api/issues/apitest')
    .send({
        _id: '66ab160cf83dee6d2f104866',
        issue_title: '',
        issue_text: '',
        created_by: '',
        assigned_to: '',
        status_text: 'N/A',
        open: false
    })
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {result: 'successfully updated', _id: '66ab160cf83dee6d2f104866'});
    })
    done();
  })
  //#8
  test("Update multiple fields on an issue", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .put('/api/issues/apitest')
    .send({
        _id: '66ab160cf83dee6d2f104866',
        issue_title: 'Fix documentation typos',
        issue_text: 'We need to fix these typos.',
        created_by: 'Bob',
        assigned_to: 'Peter',
        status_text: 'In progress',
        open: true
    })
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {result: 'successfully updated', _id: '66ab160cf83dee6d2f104866'})
    })
    done();
  })
  //#9
  test("Update an issue with missing _id", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .put('/api/issues/apitest')
    .send({
        _id: '',
        issue_title: 'Fix documentation typos',
        issue_text: 'We need to fix these typos.',
        created_by: 'Bob',
        assigned_to: 'Peter',
        status_text: 'In progress',
        open: false
    })
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {error: 'missing _id', _id: res.body._id});
    })
    done();
  })
  //#10
  test("Update an issue with no fields to update", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .put('/api/issues/apitest')
    .send({_id: '66ab160cf83dee6d2f104866'})
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {error: 'no update field(s) sent', _id: '66ab160cf83dee6d2f104866'});
    })
    done();
  })
  //#11
  test("Update an issue with an invalid _id", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .put('/api/issues/apitest')
    .send({
        _id: 'banana',
        issue_title: 'Fix documentation typos',
        issue_text: 'We need to fix these typos.',
        created_by: 'Bob',
        assigned_to: 'Peter',
        status_text: 'In progress',
        open: false
    })
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {error: "could not update", _id: 'banana'});
    })
    done();
  })
  //#12
  test("Delete an issue", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .delete('/api/issues/apitest')
    .send({
        _id: '66ab170f497706a359ce7cd0'
    })
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {result: 'successfully deleted', _id: '66ab170f497706a359ce7cd0'});
    })
    done();
  })
  //#13
  test("Delete an issue with an invalid _id", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .delete('/api/issues/apitest')
    .send({
        _id: 'apple'
    })
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {error: 'could not delete', _id: 'apple'});
    })
    done();
  })
  //#14
  test("Delete an issue with a missing _id", (done) => {
    chai.request('http://localhost:3000')
    .keepOpen()
    .delete('/api/issues/apitest')
    .send({
        _id: ''
    })
    .end((err, res) => {
        assert.equal(res.status, 200, 'Status should be 200 (OK)');
        assert.deepEqual(res.body, {error: 'missing _id'});
    })
    done();
  })
});
