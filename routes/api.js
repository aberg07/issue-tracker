'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { dbName: 'issue-tracker' });
const issueSchema = new mongoose.Schema({
    issue_title: {
      type: String,
      required: true
    },
    issue_text: {
      type: String,
      required: true
    },
    created_by: {
      type: String,
      required: true
    },
    assigned_to: {
      type: String,
      default: ''
    },
    open: {
      type: Boolean,
    },
    status_text: {
      type: String,
      default: ''
    }
}, {timestamps: {
  createdAt: 'created_on',
  updatedAt: 'updated_on'
}});
const projectSchema = new mongoose.Schema({
  project_name: {
    type: String
  },
  issues: {
    type: [issueSchema]
  }
}, {collection: 'projects'})
let project = mongoose.model('project', projectSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
    .get(async function (req, res){
      //Find the project being requested
      let projectQuery = await project.findOne({project_name: req.params.project});
      //If it doesn't exist, return an empty array
      if (projectQuery == null) res.json([]);
      else {
        if (Object.keys(req.query).length > 0) { //If the user has supplied a query we will look for issues with the values requested
          let results = [];
          let properties = Object.keys(req.query); //Grab keys of query to know which properties to match
          let values = Object.values(req.query); //Grab values of query to compare them to db entries
          for (let i = 0; i < projectQuery.issues.length; i++) {
            let currentProject = projectQuery.issues[i]
            for (let j = 0; j < properties.length; j++) {
              //Open status is stored in DB as string, but the true/false sent in the form is a string. Therefore, if we are filtering by open status, we need to first convert the string to a boolean before comparing it
              if (properties[j] === 'open') {
                let boolValue = (values[j] === 'true');
                if (currentProject[properties[j]] !== boolValue) break; //If a project's value for a given key does not match, move on to comparing the next project
              }
              else if (currentProject[properties[j]] != values[j]) break; //If a project's value for a given key does not match, move on to comparing the next project
              if (j == properties.length-1) { //If we are at the end of the array of properties to compare and haven't broken, that means the project matches what the user is looking for and we can add it to the results
                results.push(currentProject);
              }
            }
          }
          return res.json(results);
        }
        else return res.json(projectQuery.issues);
      }
    })
    
    .post(async function (req, res){
      let projectQuery = await project.findOne({project_name: req.params.project});
      //If the project being posted to doesn't exist, create it
      if (projectQuery == null) {
        let newProject = new project({
          project_name: req.params.project,
          issues: []
        });
        await newProject.save();
      }
      //Checking if issue_title, issue_text, or created_by are null, and setting them to blank to determine missing fields if not
      let title = req.body.issue_title ?? '';
      let issue = req.body.issue_text ?? '';
      let created_by = req.body.created_by ?? '';
      //If issue_title, issue_text, or created_by are missing, return an error
      if (title == '' || issue == '' || created_by == '') {
        return res.json({error: "required field(s) missing"})
      }
      //Else go ahead and create the issue
      else {
        let newIssue = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to,
          open: true,
          status_text: req.body.status_text
        };
        projectQuery = await project.findOne({project_name: req.params.project});
        projectQuery.issues.push(newIssue);
        await projectQuery.save();
        //To return all issue fields as per project specs, return the last element of the issues array in db
        return res.json(projectQuery.issues[projectQuery.issues.length-1]);
      }
    })
    
    .put(async function (req, res){
      //Checking if _id field is null, setting it to blank if so
      let _id = req.body._id ?? '';
      //If _id is missing, return an error
      if (_id === '') return res.json({
        error: "missing _id"
      });
      //First check that at least one update field has been filled in. If not, return an error
      for (let i = 0; i < Object.keys(req.body).length; i++) {
        //If there is at least one field with input that is not the _id field, it is valid
        if (Object.values(req.body)[i] !== '' && Object.keys(req.body)[i] !== '_id') break;
        //Else if we have checked all fields and there is no input, return an error
        if (i == Object.keys(req.body).length-1) return res.json({
          error: "no update field(s) sent",
          _id: req.body._id
        })
      }
      //Field has at least one input, proceed with looking for the project
      let projectQuery = await project.findOne({project_name: req.params.project})
      //If the project is not found, return an error
      if (projectQuery == null) return res.json({
        error: "could not update",
        _id: req.body._id
      });
      //Else, start looking for issue to update
      let issueToUpdate;
      for (let i = 0; i < projectQuery.issues.length; i++) {
        if (projectQuery.issues[i]._id == req.body._id) issueToUpdate = projectQuery.issues[i];
      }
      //If the issue with inputted _id was not found, return an error
      if (issueToUpdate == null) return res.json({
        error: "could not update",
        _id: req.body._id
      });
      else {
        //Update only the issues for which the user has submitted an input (ex. if title is blank, title will be left unchanged)
        for (let i = 0; i < Object.keys(req.body).length; i++) {
          let update = Object.keys(req.body)[i];
          let updateValue = Object.values(req.body)[i]

          //If there is no input for this field, skip it to avoid overwriting existing issues with blanks.
          //Additionally, do nothing for the _id field to avoid unintentionally changing it
          if (updateValue === '' || update === '_id') continue;
          else issueToUpdate[update] = updateValue;
        }
        await projectQuery.save();
        res.json({
          result: "successfully updated",
          _id: issueToUpdate._id
        });
      }
    })
    
    .delete(async function (req, res){
      let _id = req.body._id ?? '';
      //If _id field is empty, return an error
      if (_id === '') return res.json({error: "missing _id"});
      //Else, look for the project name
      let projectQuery = await project.findOne({project_name: req.params.project});
      //If the project doesn't exist, return an error
      if (projectQuery == null) return res.json({error: "could not delete", _id: req.body._id});
      let indexToDelete;
      for (let i = 0; i < projectQuery.issues.length; i++) {
        //If we find an issue with the _id requested, store the index in indexToDelete
        if (projectQuery.issues[i]._id == req.body._id) {
          indexToDelete = i;
          break;
        }
        //Else if we have reached the end of the issue array and the issue with _id wasn't found, return an error
        else if (i == projectQuery.issues.length-1) return res.json({error: "could not delete", _id: req.body._id});
      }
      //Delete the issue at index we found
      projectQuery.issues.splice(indexToDelete, 1);
      await projectQuery.save();
      res.json({result: "successfully deleted", _id: req.body._id})
    });
    
};
