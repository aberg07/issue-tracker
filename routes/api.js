'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, dbName: 'issue-tracker' });
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
      type: String
    },
    open: {
      type: Boolean,
      required: true
    },
    status_text: {
      type: String
    }
}, {timestamps: {
  createdAt: 'created_on',
  updatedAt: 'updated_on'
}}, {collection: 'issues'});
const projectSchema = new mongoose.Schema({
  project_name: {
    type: String
  },
  projects: {
    type: [issueSchema]
  }
}, {collection: 'projects'})

module.exports = function (app) {

  app.route('/api/issues/:project')
    .get(async function (req, res){
      let project = mongoose.model('project', projectSchema);
      let projectQuery = await project.findOne({project_name: req.params.project});
      if (projectQuery == null) {
        let newProject = new project({
          project_name: req.params.project,
          projects: []
        });
        await newProject.save();
        projectQuery = await project.findOne({project_name: req.params.project});
      }
      res.json(projectQuery.projects);
    })
    
    .post(async function (req, res){
      let project = mongoose.model('project', projectSchema);
      let projectQuery = await project.findOne({project_name: req.params.project});
      if (projectQuery == null) {
        let newProject = new project({
          project_name: req.params.project,
          projects: []
        });
        await newProject.save();
      }
      let issue = mongoose.model('issue', issueSchema)
      if (req.body.issue_title == '' || req.body.issue_text == '' || req.body.created_by == '') {
        res.json({error: "required field(s) missing"})
      }
      else {
        let newIssue = new issue({
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to,
          open: true,
          status_text: req.body.status_text
        });
        await newIssue.save();
        projectQuery = await project.findOne({project_name: req.params.project});
        projectQuery.projects.push(newIssue);
        await projectQuery.save();
        res.json(newIssue);
      }
    })
    
    .put(function (req, res){
      let project = req.params.project;
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      
    });
    
};
