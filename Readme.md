# Natural Resource Employee Web Map/App

An internal NPS web mapping application for finding the location
of Natural Resouce skills across the Alaska Region of the 
Natural Park Service.

This web page contains names of NPS employees, the park where
employees work, and the percent of their time is spent in
selected natural resource categories.  This is not Personally
Identifiable Information.

# Build

There is no build step required for this app to work.  However
it does require data in JSON format to be useful.  This
data was exported to JSON from a database created by
Angie Southwould. Since the project was a prototype a
data refresh process was not developed. The app is strongly
tied to the schema in the JSON files, and will need to be
modified if there is a change to the schema.

## Deploy

Copy all the files in the repo, except `.git`, `.gitignore`,
`.gitattributes`, and `Readme.md` to a published folder on
a web server.

The files in `data` can be updated at anytime (provided the
format/schema does not change) without redeploying the app.

# Using

Click a Natural Resource Category or sub Category to see where
in Alaska employees in that category are located.  Click a
location to see a list of the employees at that location.