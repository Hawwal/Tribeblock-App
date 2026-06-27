# Tribe Block University Contributor README

This guide explains how to contribute complete courses to Tribe Block University in a simple, step-by-step way.

You do not need to be a software engineer to write a course. Think of each course as a well-organized learning package: clear lessons, practice tasks, quizzes, assignments, tests, exams, puzzles, and guided practical projects for the in-app IDE.

## 1. Know Which GitHub Repository To Use

Tribe Block has two different GitHub areas:

- Tribe Block app: https://github.com/Hawwal/Tribeblock-App
- Tribe Block University courses: https://github.com/orgs/Tribe-Block-University/repositories

Use the course repositories when you are writing or improving learning content.

Use the app repository only when you are changing the website, backend, payment system, IDE system, admin dashboard, rewards system, or other platform code.

Most course contributors should work inside the Tribe Block University course repositories, not inside the app repository.

## 2. What A Complete Course Must Include

A complete course should include:

- Course overview
- Modules
- Lessons
- Lesson summaries
- Cheatsheet PDF for each lesson
- Beginner-friendly explanations
- Code examples
- IDE practice tasks
- Assignments
- Tests and validation checks
- Quizzes
- Puzzles
- Organized practical projects
- Final exam
- Final build project
- Certificate readiness notes

Every course should help a student move from "I do not understand this yet" to "I can explain it, practice it, and build something with it."

## 3. Recommended Course Folder Structure

Create one repository or folder for each course.

Example for a course called `learn-html`:

```text
learn-html
|-- README.md
|-- assets
|   |-- cheatsheets
|   |   |-- lesson-1-html-elements.pdf
|   |   |-- lesson-2-html-links.pdf
|   |   `-- lesson-3-html-forms.pdf
|   `-- images
|       `-- sample-page-layout.png
|-- module-1-web-page-foundations
|   |-- README.md
|   |-- lesson-1-html-elements.md
|   |-- lesson-2-html-links.md
|   |-- lesson-3-html-forms.md
|   |-- quiz.md
|   |-- assignment.md
|   |-- puzzle.md
|   `-- practical.md
|-- module-2-semantic-html
|   |-- README.md
|   |-- lesson-1-page-sections.md
|   |-- lesson-2-accessible-markup.md
|   |-- quiz.md
|   |-- assignment.md
|   |-- puzzle.md
|   `-- practical.md
|-- final-exam.md
`-- final-project.md
```

Keep names short, clear, and lowercase where possible.

## 3A. Automatic Course Sync Template

Tribe Block can automatically understand a course repository after an approved GitHub pull request is merged.

For automatic syncing, every course must include a `course.yml` file. The course `slug` is the most important field because the app uses it to know whether to create a new course or update an existing course.

If the `slug` already exists in the app, the existing course is updated.

If the `slug` does not exist yet, a new course is created.

Recommended automatic structure:

```text
learn-html
|-- course.yml
|-- final-exam.md
|-- final-project.yml
|-- modules
|   |-- 01-html-foundations
|   |   |-- module.yml
|   |   |-- lessons
|   |   |   |-- 01-html-elements.md
|   |   |   `-- 02-html-links.md
|   |   |-- quizzes
|   |   |   `-- checkpoint.yml
|   |   |-- exercises
|   |   |   `-- elements-practice.yml
|   |   |-- practicals
|   |   |   `-- profile-card
|   |   |       `-- practical.yml
|   |   |-- assignment.md
|   |   `-- puzzle.md
|   `-- 02-semantic-html
|       |-- module.yml
|       `-- lessons
|           `-- 01-page-sections.md
`-- assets
    `-- cheatsheets
        `-- html-elements.pdf
```

The app currently imports these files automatically:

- `course.yml` for course details
- `module.yml` for module details
- lesson `.md` files inside `modules/.../lessons`
- quiz `.yml` files inside `modules/.../quizzes`
- exercise `.yml` files inside `modules/.../exercises`
- practical project `.yml` files inside `modules/.../practicals/...`
- `assignment.md` as an assignment lesson
- `puzzle.md` as a puzzle lesson
- `final-exam.md` as a final exam lesson
- `final-project.yml` as the final project

Use this `course.yml` template:

```yml
title: Learn HTML
slug: learn-html
subtitle: Structure web pages with semantic markup.
description: Learn elements, attributes, links, forms, and page structure.
category: frontend
level: BEGINNER
visibility: FREE
isFreeBasic: true
hasProProject: true
estimatedHours: 8
languageTags:
  - HTML
skillTags:
  - Web foundations
  - Semantic markup
status: PUBLISHED
```

Use this `module.yml` template:

```yml
title: HTML Foundations
summary: Learn the basic building blocks of an HTML page.
sortOrder: 1
visibility: FREE
```

Use this lesson markdown template:

```md
---
title: HTML Elements
summary: Learn how HTML elements describe page content.
visibility: FREE
estimatedMinutes: 25
assets:
  - type: PDF
    title: HTML Elements Cheatsheet
    url: /assets/cheatsheets/html-elements.pdf
    license: Original Tribe Block University material
---

# HTML Elements

Lesson explanation goes here.

## IDE Practice

Practice instructions go here.
```

Use this quiz template:

```yml
title: HTML Elements Checkpoint
lessonSlug: html-elements
passingScore: 70
questions:
  - type: MULTIPLE_CHOICE
    prompt: What does an HTML element usually include?
    options:
      - An opening tag, content, and closing tag
      - Only a color
      - Only a database row
    correctAnswer:
      - An opening tag, content, and closing tag
    explanation: Most HTML elements wrap content between opening and closing tags.
```

Use this IDE exercise template:

```yml
title: Build Your First HTML Card
lessonSlug: html-elements
instructions: |
  Add a heading, paragraph, and button inside the starter HTML.
runtime: BROWSER_HTML_CSS_JS
visibility: FREE
starterFiles:
  index.html: |
    <main>
      <!-- Build here -->
    </main>
  style.css: |
    body {
      font-family: system-ui, sans-serif;
    }
tests:
  - name: Heading exists
    assertion: The submitted HTML includes one heading.
    isHidden: false
  - name: Button exists
    assertion: The submitted HTML includes one button.
    isHidden: false
```

Use this practical project template:

```yml
title: Profile Card Practical
slug: profile-card-practical
briefMarkdown: |
  Build a simple profile card using HTML and CSS.
runtime: BROWSER_HTML_CSS_JS
visibility: PLUS
starterFiles:
  index.html: |
    <main class="card"></main>
  style.css: |
    body {
      font-family: system-ui, sans-serif;
    }
rubric:
  correctness: 40
  codeQuality: 30
  userExperience: 20
  reflection: 10
```

Use this final project template:

```yml
title: HTML Portfolio Page
slug: html-portfolio-page
briefMarkdown: |
  Build a portfolio page that uses semantic HTML sections, links, images, and forms.
runtime: BROWSER_HTML_CSS_JS
visibility: PRO
starterFiles:
  index.html: |
    <main></main>
rubric:
  correctness: 40
  codeQuality: 30
  userExperience: 20
  reflection: 10
```

Automatic sync happens after an approved pull request is merged in GitHub. The webhook tells the Tribe Block backend that the course repository changed, then the backend reads the course files and updates the app.

For now, GitHub should be treated as the main source of truth for course content. The admin portal is used for review, publishing control, contributor tracking, rewards, and emergency edits.

## 3B. GitHub Team Automation

Tribe Block can also automate GitHub access for contributors and course repositories.

When a contributor application is approved in the admin dashboard, the backend can add or invite that GitHub username to the `course-contributors` team.

Admins can also open the admin dashboard and use **GitHub Course Sync > Apply Team Access** to apply the standard team permissions to a course repository.

Recommended team permissions:

- `course-contributors`: write access, but protected branches stop direct merging
- `course-reviewers`: maintain access
- `admins`: admin access

The backend needs these Render environment variables:

```text
GITHUB_ORG_AUTOMATION_ENABLED=true
GITHUB_ORG_ADMIN_TOKEN=your_real_github_org_token
GITHUB_ORG_NAME=Tribe-Block-University
GITHUB_CONTRIBUTOR_TEAM_SLUG=course-contributors
GITHUB_REVIEWER_TEAM_SLUG=course-reviewers
GITHUB_ADMIN_TEAM_SLUG=admins
```

The GitHub token must belong to an account or GitHub App that has permission to manage organization teams and repository access.

## 4. Step 1: Write The Course Overview

Start with the course `README.md`.

Use this format:

```md
# Course Title

Short description:

Who this course is for:

Difficulty:
Beginner / Intermediate / Advanced

Estimated time:

Prerequisites:

What the student will learn:
- Outcome 1
- Outcome 2
- Outcome 3

What the student will build:
- Practical project 1
- Final project

Course modules:
1. Module name
2. Module name
3. Module name
```

Write this like you are explaining the course to a new student.

## 5. Step 2: Break The Course Into Modules

A module is a group of related lessons.

Good module examples:

- HTML Page Foundations
- CSS Layout Basics
- JavaScript Functions And Logic
- React Components And State
- Python Data Structures

Each module should have its own `README.md`.

Use this format:

```md
# Module Title

Module goal:

Lessons in this module:
1. Lesson title
2. Lesson title
3. Lesson title

Main skills practiced:
- Skill 1
- Skill 2
- Skill 3

Module practical:
Describe what the student will build at the end of this module.
```

## 6. Step 3: Write Each Lesson

Each lesson should be focused. Avoid trying to teach too many ideas at once.

Use this format:

```md
# Lesson Title

## Objective

By the end of this lesson, the student will be able to...

## Why This Matters

Explain why this lesson is useful in real projects.

## Explanation

Teach the concept in simple language.

## Example

Show a short code example.

## Common Mistake

Explain one mistake beginners often make and how to avoid it.

## IDE Practice

Give the student a small task to complete inside the Tribe Block IDE.

## Expected Result

Explain what should happen when the student runs the code.

## Hints

- Hint 1
- Hint 2

## Validation Checks

- Check 1
- Check 2
- Check 3

## Quiz Questions

Add 3 to 5 questions.

## Cheatsheet

Link to the lesson cheatsheet PDF.

## Extra Resources

Only add resources that are original, open-source, public-domain, or allowed by the license.
```

## 7. Step 4: Add IDE Practice For Every Lesson

Every lesson should include one practice task for the in-app IDE.

The IDE currently supports these types of practice:

- Browser HTML, CSS, and JavaScript
- Node.js
- TypeScript
- Python
- Java
- C++
- Bash
- SQL
- Solidity

When writing an IDE practice task, include:

- Task title
- Student instructions
- Starter files
- Expected result
- Hints
- Visible checks
- Hidden checks, if needed
- Optional solution file for reviewers

Example:

````md
## IDE Practice

Title:
Create a simple profile card

Instructions:
1. Open `index.html`.
2. Add a heading with your name.
3. Add one paragraph describing your learning goal.
4. Open `style.css`.
5. Change the background color and text color.
6. Run the project.

Starter files:

index.html
```html
<main class="profile-card">
  <!-- Add your content here -->
</main>
```

style.css
```css
body {
  font-family: system-ui, sans-serif;
}
```

Expected result:
The page should show a styled profile card with a heading and paragraph.

Validation checks:
- `index.html` includes one heading.
- `index.html` includes one paragraph.
- `style.css` changes the visual style.
````

## 8. Step 5: Add Assignments

An assignment is larger than a lesson practice but smaller than a full project.

Use assignments to help students apply several lessons together.

Use this format:

```md
# Assignment Title

Goal:

Student instructions:
1. Step one
2. Step two
3. Step three

Submission requirement:

Expected result:

Grading checklist:
- Requirement 1
- Requirement 2
- Requirement 3

Bonus challenge:
```

## 9. Step 6: Add Quizzes

Quizzes should test understanding, not memorization only.

Use 3 to 10 questions per lesson or module.

Supported question types:

- Multiple choice
- Multi-select
- True or false
- Short answer

Use this format:

```md
# Quiz Title

Passing score:
70%

## Question 1

Question:

Type:
Multiple choice

Options:
- A
- B
- C
- D

Correct answer:

Explanation:
```

Every quiz question should include an explanation so students learn from mistakes.

## 10. Step 7: Add Tests And Validation Checks

Tests tell the IDE how to check whether the student's work is correct.

For non-technical contributors, write the test idea in plain English. A technical reviewer can later convert it into automated checks if needed.

Example plain-English checks:

- The page must include a button.
- The button text must say "Start Learning".
- The JavaScript function must return the total price.
- The Python program must print the student's name.
- The SQL query must return only active students.

Use this format:

```md
# Tests

Visible tests:
- The student can see this check before submitting.
- Example: The page includes an `h1` heading.

Hidden tests:
- The student cannot see this check before submitting.
- Example: The solution still works when the input changes.
```

## 11. Step 8: Add Puzzles

Puzzles are short challenges that make learning more engaging.

Good puzzle types:

- Fix the broken code
- Put the steps in the correct order
- Find the missing line
- Predict the output
- Match the concept to the example
- Debug the error message

Use this format:

```md
# Puzzle Title

Puzzle type:

Instructions:

Starting material:

Correct answer:

Explanation:
```

## 12. Step 9: Add Organized Practicals

Practicals are guided mini-projects inside the IDE.

They should feel like building something real, one step at a time.

Use this format:

```md
# Practical Title

What the student will build:

Skills used:
- Skill 1
- Skill 2
- Skill 3

Starter files:

Milestone 1:

Milestone 2:

Milestone 3:

Final expected result:

Review checklist:
- Requirement 1
- Requirement 2
- Requirement 3
```

Good practical examples:

- Build a personal profile page
- Build a pricing card
- Build a quiz app
- Build a weather dashboard
- Build a simple API
- Build a portfolio landing page
- Build a smart contract payment demo

## 13. Step 10: Add A Final Exam

The final exam should prove that the student understands the whole course.

Use a mix of:

- Multiple-choice questions
- True or false questions
- Short-answer questions
- Code-reading questions
- Debugging questions

Use this format:

```md
# Final Exam

Passing score:
70%

Total questions:

Topics covered:
- Topic 1
- Topic 2
- Topic 3

Questions:
```

## 14. Step 11: Add A Final Project

The final project is the student's portfolio-ready proof of learning.

Use this format:

```md
# Final Project

Project title:

Project brief:

What the student will build:

Required features:
- Feature 1
- Feature 2
- Feature 3

Starter files:

Milestones:
1. Setup
2. Core feature
3. Styling or polishing
4. Testing
5. Final submission

Rubric:
- Correctness: 40%
- Code quality: 30%
- User experience: 20%
- Reflection: 10%

Submission checklist:
- The project runs
- The required features are complete
- The student has tested their work
- The student can explain what they built
```

Basic students may access foundational lessons and practice. Plus and Pro students can access guided build projects. Pro students can receive certificates where eligible.

## 15. Step 12: Add Cheatsheet PDFs

Every lesson should have a cheatsheet PDF.

A cheatsheet should be short and easy to scan.

Recommended sections:

- Key terms
- Syntax examples
- Common mistakes
- Quick reference table
- Mini practice prompt

Place cheatsheets inside:

```text
assets/cheatsheets
```

Name them clearly:

```text
lesson-1-html-elements.pdf
lesson-2-html-links.pdf
lesson-3-html-forms.pdf
```

## 16. Step 13: Respect Content Licensing

Do not copy lessons from paid learning platforms, books, or private training content.

You may use:

- Original Tribe Block explanations
- Your own examples
- Public-domain material
- Open-source material where the license allows reuse
- Official documentation as a reference
- MDN Web Docs as a reference for web foundations

When using an outside reference, add a short note:

```md
Reference:
MDN Web Docs, used as a learning reference.
License:
CC-BY-SA, where applicable.
```

The safest approach is to write original lessons in your own words.

## 17. Step 14: Submit Your Course For Review

When your course is ready:

1. Open the correct Tribe Block University course repository.
2. Add or update the course files.
3. Create a pull request.
4. In the pull request description, explain what you added.
5. Add screenshots or examples if helpful.
6. Wait for admin and mentor review.
7. Make requested changes if reviewers ask for them.
8. Once approved, the course can be merged and synced into the platform.

New courses and major changes are reviewed before they appear on the live platform.

## 18. What Admins And Reviewers Check

Admins and mentor reviewers check:

- The course is original or properly licensed.
- The lessons are clear for the target level.
- Every lesson has practice.
- Exercises have expected results and validation checks.
- Quizzes have correct answers and explanations.
- Projects are useful and realistic.
- Cheatsheets are included.
- The course is organized well.
- The course does not include harmful, copied, or low-quality content.

After review, admins can publish approved courses in the Tribe Block admin dashboard.

## 19. Contributor Rewards

Approved contributors may be eligible for G$ rewards.

To make reward processing easier, make sure your contributor profile includes:

- Your GitHub username
- Your wallet address
- Your email address
- The course repository you contributed to
- The pull request link

Rewards are reviewed by the Tribe Block team. Not every edit automatically creates a reward. Quality, usefulness, and approval status matter.

## 20. Simple Contributor Checklist

Before submitting, check that your course has:

- A course `README.md`
- Clear modules
- Complete lessons
- IDE practice in every lesson
- Assignments
- Quizzes
- Tests or validation checks
- Puzzles
- Organized practicals
- Final exam
- Final project
- Cheatsheet PDFs
- Source or license notes for external references
- A clear pull request description

## 21. Quick Copy Template

Use this mini template when starting a new lesson:

```md
# Lesson Title

## Objective

## Why This Matters

## Explanation

## Example

## Common Mistake

## IDE Practice

Title:

Instructions:
1.
2.
3.

Starter files:

Expected result:

Hints:
- 

Validation checks:
- 

## Assignment

## Puzzle

## Quiz

## Cheatsheet

## References And License Notes
```

## 22. Need Help?

If you are not sure where your contribution belongs:

- Course content belongs in the Tribe Block University course repositories.
- Platform code belongs in the Tribe Block app repository.
- Questions about course quality should go to admins or mentor reviewers.
- Questions about rewards should go through the contributor/rewards workflow.

The goal is simple: create courses that help students learn by reading, practicing, testing themselves, and building real projects.
