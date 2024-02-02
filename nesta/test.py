from pprint import pprint
from ojd_daps_skills.pipeline.extract_skills.extract_skills import ExtractSkills #import the module

es = ExtractSkills(config_name="extract_skills_lightcast") #instantiate with toy taxonomy configuration file

es.load() #load necessary models

job_adverts = """
javascript
SARAH WONG
Senior Full-Stack Developer
CONTACT
sarahjwong@email.com
(123) 456-7890
Atlanta, GA
LinkedIn
EDUCATION
B.S.
Computer Science
University of Georgia
September 2011 - June 2015
Athens, GA
SKILLS
JavaScript
CircleCI
BitBucket
TravisCI
Python
Angular.js
Vue.js
React.js
Node.js
HTML
CSS
Django
SQL
RESTful APIs
Agile/Scrum
WORK EXPERIENCE
Senior Full-Stack Developer
Artis Technologies
January 2019 - current / Athens, GA
· Led architecture, design, and development of 30+ new features.
· Presented and conveyed ideas and designs with 4+ technical
teams and 12+ business partners.
· Developed 40+ applications following Agile product
development methodologies.
· Oversaw the development and maintenance of new products,
technical documentation and workflows.
· Designed, built and automated data flows to save 10+ hours of
tedious work per week.
Full-Stack Developer
Collabera
April 2017 - January 2019 / Atlanta, GA
· Assisted in requirements analysis, High Level Design, Low Level
Design, and complex code development for 20+ applications.
· Provided technical direction and system architecture for 40+
individual initiatives.
· Communicated with line of business and managed the overall
status and health of 20+ applications.
· Collaborated with external programmers to coordinate delivery
of 6 new software applications.
· Wrote 200+ unit tests to ensure 100% of code within SDLC was
without bugs.
· Attended 100+ weekly standup meetings to receive weekly
tasks and mentorship from senior developers.
Junior Full-Stack Engineer
CharterUP
June 2015 - April 2017 / Atlanta, GA
· Learned organization’s overall strategies, business operates,
and what drives success in the business.
· Collaborated with 3 engineering and design teams to integrate
external APIs into web pages and applications.
· Evaluated and improved existing data systems under mentor
supervision."""

job_post = job_adverts.split("\n") #split the job advert into a list of strings

# job_post = [
#     "javascript",
#     "python",
#     "react",
#     "angular",
#     "node",
#     "django"
# ]
# javascript
# python
# react
# angular
# node
# django

job_skills_matched = es.extract_skills(job_post, True) #match and extract skills to toy taxonomy
pprint(job_skills_matched) #print the results


for (i, job) in enumerate(job_skills_matched[0]["SKILL"]):
    pprint(job[1])