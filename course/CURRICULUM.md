# Course Curriculum - Detailed Lesson Plans

## Module 1: Foundations

### Lesson 1.1: Welcome & Course Overview (5 min)

**Video Script Outline:**

```
INTRO (30 sec)
- Welcome to Changeover Optimization Practitioner
- What you'll learn in this course
- Why this matters for your career

COURSE STRUCTURE (2 min)
- 6 modules, 4-6 hours total
- Self-paced learning
- Hands-on exercises with real software
- Certification at the end

WHAT YOU'LL BE ABLE TO DO (1.5 min)
- Assess changeover performance
- Calculate true costs and ROI
- Optimize production sequences
- Apply SMED to cut changeover time by 50%+
- Create sustainable standard work

HOW TO SUCCEED (1 min)
- Complete all exercises
- Download and use the templates
- Apply to your real situation as you learn
- Ask questions via email support
```

---

### Lesson 1.2: The Changeover Problem (10 min)

**Video Script Outline:**

```
THE REALITY (2 min)
- Changeovers are everywhere in manufacturing
- Every changeover = lost production time
- "We've always done it this way" trap

WHAT IS A CHANGEOVER? (2 min)
- Definition: Time from last good piece of A to first good piece of B
- Includes: Setup, adjustment, first-piece inspection
- NOT just the obvious machine downtime

THE HIDDEN IMPACT (3 min)
- Direct: Machine downtime
- Indirect: WIP inventory, batch sizes, flexibility
- Strategic: Ability to respond to customer demand

REAL EXAMPLE (2 min)
- Packaging company case study
- 45-minute changeovers, 6 times per day
- 4.5 hours lost daily = €100K+ annually

THE GOOD NEWS (1 min)
- Changeovers can be dramatically reduced
- 50-90% reduction is achievable
- This course shows you how
```

**Key Points to Cover:**
- Changeover time often underestimated
- Hidden costs multiply the impact
- Big opportunity for improvement

---

### Lesson 1.3: Hidden Costs: Beyond Setup Time (10 min)

**Video Script Outline:**

```
THE ICEBERG ANALOGY (2 min)
- Visible: Machine downtime
- Hidden: 5-10x the visible cost
- [Visual: Iceberg diagram]

HIDDEN COST #1: BATCH SIZE (2 min)
- Long changeovers → large batches
- Large batches → more inventory
- Example calculation: 30-min changeover forces 4-hour batches

HIDDEN COST #2: WIP INVENTORY (2 min)
- Work-in-process ties up cash
- Storage space costs
- Risk of obsolescence
- Example: €50K in WIP due to batching

HIDDEN COST #3: FLEXIBILITY (2 min)
- Can't respond to rush orders
- Long lead times to customers
- Lost sales opportunities

HIDDEN COST #4: QUALITY (1 min)
- First-piece issues multiply with batch size
- Scrap and rework increase
- Detection delays

CALCULATING TRUE COST (1 min)
- Direct time cost
- + Inventory carrying cost
- + Flexibility cost
- = True changeover cost
- [Preview of ROI calculator]
```

**Exercise:**
Identify 3 hidden costs in your own operation.

---

### Lesson 1.4: Toyota's Journey (10 min)

**Video Script Outline:**

```
THE PROBLEM TOYOTA FACED (2 min)
- 1950s: Small market, many models
- Couldn't afford mass production approach
- Needed flexibility with limited resources

ENTER SHIGEO SHINGO (2 min)
- Industrial engineer consulting for Toyota
- Observed 1,000-ton press: 4-hour changeover
- Challenge: Reduce to under 10 minutes

THE BREAKTHROUGH (3 min)
- Distinguished internal vs external operations
- Moved work outside of machine stoppage
- Streamlined remaining internal work
- Result: 4 hours → 3 minutes over 19 years

SMED IS BORN (2 min)
- Single-Minute Exchange of Die
- "Single-minute" = under 10 minutes (single digit)
- Not literally 1 minute (though sometimes achieved)

WHAT THIS MEANS FOR YOU (1 min)
- The methodology is proven
- Works in any industry with changeovers
- You'll learn the same approach Toyota used
```

**Key Points:**
- SMED = Single-Minute Exchange of Die (under 10 minutes)
- Internal vs External is the key distinction
- Methodology works universally

---

### Lesson 1.5: Assessment Fundamentals (10 min)

**Video Script Outline:**

```
WHY ASSESS FIRST? (2 min)
- Understand current state before improving
- Identify biggest opportunities
- Build baseline for measuring improvement

THE ASSESSMENT PROCESS (3 min)
1. List all changeover types
2. Record frequency and duration
3. Calculate total time and cost
4. Prioritize by impact

WHAT TO MEASURE (2 min)
- Changeover frequency (per day/week)
- Average duration (actual, not estimated)
- Variability (best vs worst)
- Cost per minute of downtime

QUICK ASSESSMENT EXAMPLE (2 min)
[Screen share: Assessment Worksheet]
- Walk through sample data
- Show calculations
- Highlight insights

YOUR FIRST EXERCISE (1 min)
- Download Assessment Worksheet
- Fill in for your top 3 changeover types
- Calculate total weekly changeover time
```

**Deliverable:** Assessment Worksheet (Excel)

---

## Module 2: Sequence Optimization

### Lesson 2.1: What is Sequence Optimization? (10 min)

**Video Script Outline:**

```
THE SEQUENCING CHALLENGE (2 min)
- Same orders, different sequences, different results
- Example: 10 orders = 3.6 million possible sequences
- How do you find the best one?

FIFO VS OPTIMIZED (3 min)
- FIFO: First In, First Out (simple but wasteful)
- Example: A→B→A→B vs A→A→B→B
- [Visual: Side-by-side comparison]
- Savings can be 30-50% of changeover time

THE OPTIMIZATION PRINCIPLE (3 min)
- Group similar products together
- Minimize attribute changes
- Respect due date constraints
- Balance changeover time vs delivery

WHEN TO USE SEQUENCE OPTIMIZATION (2 min)
- Multiple products on same line
- Changeover times vary by product type
- Flexible due dates (some slack)
- NOT suitable: Fixed sequence requirements
```

**Key Points:**
- Sequence matters enormously
- Optimization finds best grouping
- 30-50% savings typical

---

### Lesson 2.2: Building a Changeover Hierarchy (15 min)

**Video Script Outline:**

```
WHAT IS A CHANGEOVER HIERARCHY? (3 min)
- Products have attributes (color, size, material...)
- Different attributes take different times to change
- Hierarchy = which changes take longest

EXAMPLE: PACKAGING LINE (4 min)
- Attribute 1: Film type (30 min to change)
- Attribute 2: Print design (15 min to change)
- Attribute 3: Pack size (5 min to change)
- Hierarchy: Film > Print > Size

BUILDING YOUR HIERARCHY (4 min)
Step 1: List all product attributes
Step 2: Estimate changeover time for each
Step 3: Rank from longest to shortest
Step 4: Validate with production team

COMMON PATTERNS (2 min)
- Material/tooling changes longest
- Color/graphics medium
- Size/format shortest
- Your pattern may differ!

EXERCISE WALKTHROUGH (2 min)
[Screen share: Hierarchy Template]
- Fill in sample data together
- Discuss how to gather this info
```

**Deliverable:** Changeover Hierarchy Template

**Exercise:** Build hierarchy for your main production line.

---

### Lesson 2.3: The Optimization Algorithm (10 min)

**Video Script Outline:**

```
HOW OPTIMIZATION WORKS (3 min)
- Input: Orders, products, changeover times
- Process: Try many sequences, find best
- Output: Optimized sequence + time savings

THE ALGORITHM EXPLAINED (SIMPLE) (4 min)
- Not trying all possibilities (too many)
- Uses smart heuristics
- Respects constraints (due dates)
- Finds very good solution fast

WHAT THE SOFTWARE DOES (2 min)
1. Reads your orders and hierarchy
2. Calculates changeover time for any sequence
3. Searches for minimum total changeover
4. Shows before/after comparison

LIMITATIONS (1 min)
- Needs good changeover time data
- Can't handle very complex constraints
- Human judgment still needed for edge cases
```

**Key Points:**
- Algorithm finds near-optimal solution
- Garbage in = garbage out (need good data)
- Software handles the complexity

---

### Lesson 2.4: Software Walkthrough (15 min)

**Video Script Outline:**

```
SOFTWARE OVERVIEW (2 min)
[Screen share: ChangeOverOptimizer]
- Main navigation
- Key screens

IMPORTING ORDERS (4 min)
- Excel/CSV import
- Required columns
- Handling errors
- Demo with sample file

CONFIGURING CHANGEOVERS (4 min)
- Setting up hierarchy
- Entering changeover times
- Product attributes
- Demo configuration

RUNNING OPTIMIZATION (3 min)
- Select orders to optimize
- Choose options (respect due dates, etc.)
- Run and view results
- Before/after comparison

EXPORTING SCHEDULE (2 min)
- Export to Excel
- Print view
- Share with team
```

**Hands-on Exercise:**
1. Download sample data file
2. Import into ChangeOverOptimizer (use free trial)
3. Configure changeover hierarchy
4. Run optimization
5. Note the time savings

---

### Lesson 2.5: Interpreting Results (10 min)

**Video Script Outline:**

```
READING THE RESULTS (3 min)
- Total changeover time: before vs after
- Savings in minutes and percentage
- Sequence visualization

DUE DATE CONFLICTS (2 min)
- Software flags conflicts
- How to resolve
- When to accept tradeoffs

WHAT IF SAVINGS ARE LOW? (2 min)
- Check changeover data accuracy
- Check hierarchy configuration
- Some situations have less opportunity

TAKING ACTION (2 min)
- Publishing the schedule
- Communicating to production
- Tracking actual vs planned

CONTINUOUS IMPROVEMENT (1 min)
- Run optimization daily/weekly
- Update changeover times as SMED improves
- Review and refine hierarchy
```

---

## Module 3: SMED Methodology

### Lesson 3.1: SMED Origins (10 min)

**Video Script Outline:**

```
THE SHINGO STORY (4 min)
- Shigeo Shingo: industrial engineer
- 1950: First observations at Mazda
- 1969: The 1,000-ton press breakthrough
- 19 years of refinement at Toyota

THE FAMOUS RESULT (2 min)
- 1,000-ton press changeover
- Before: 4 hours
- After: 3 minutes
- How? The SMED system

SMED DEFINED (2 min)
- Single-Minute Exchange of Die
- Single-minute = under 10 minutes
- Die = any tooling/setup (not just stamping)

WHY SMED STILL MATTERS (2 min)
- Methodology unchanged since 1970s
- Still the gold standard
- Works in any industry
- You're learning from the masters
```

---

### Lesson 3.2: The 4 Stages of SMED (15 min)

**Video Script Outline:**

```
OVERVIEW OF 4 STAGES (2 min)
[Visual: 4-stage diagram]
- Stage 1: Observe current state
- Stage 2: Separate internal/external
- Stage 3: Convert internal to external
- Stage 4: Streamline everything

STAGE 1: OBSERVE (3 min)
- Record the changeover (video if possible)
- Document every step
- Time each step
- Don't judge yet, just observe

STAGE 2: SEPARATE (4 min)
- Internal: MUST stop machine
- External: CAN do while running
- Many "internal" steps are actually external
- Just moving them saves 30-50%

STAGE 3: CONVERT (3 min)
- Challenge: Why must this be internal?
- Techniques: Pre-staging, pre-heating, etc.
- Example: Getting tools (internal → external)
- Additional 25-50% savings possible

STAGE 4: STREAMLINE (3 min)
- Reduce time for remaining steps
- Parallel operations
- Quick-release devices
- Elimination of adjustments
- Final push to single-digit minutes
```

**Key Points:**
- Stage 2 (separate) gives quickest wins
- Stages done in sequence
- Each stage builds on previous

---

### Lesson 3.3: Stage 1 - Observe & Record (15 min)

**Video Script Outline:**

```
WHY OBSERVATION MATTERS (2 min)
- You can't improve what you don't understand
- Assumptions are usually wrong
- Data beats opinions

HOW TO OBSERVE (4 min)
- Watch a real changeover
- Video recording (highly recommended)
- Note every action
- Include waiting, walking, searching

DOCUMENTING STEPS (4 min)
[Screen share: SMED Study Template]
- Step number
- Description (be specific)
- Duration (minutes:seconds)
- Category (prep, removal, install, adjust, cleanup)
- Notes/observations

COMMON MISTAKES (3 min)
- Too vague: "Setup" vs "Remove 12 bolts from die"
- Missing steps: Walking, searching, waiting
- Averaging: Record actual, not "typical"

LIVE EXAMPLE (2 min)
[Show case study video]
- Walk through documentation process
- Fill in template together
```

**Exercise:** Document a changeover using the SMED Study Template.

---

### Lesson 3.4: Stage 2 - Classify Internal vs External (15 min)

**Video Script Outline:**

```
THE KEY DISTINCTION (3 min)
- Internal: Machine MUST be stopped
- External: Machine CAN be running
- The question: "Does the machine need to be stopped for this?"

CLASSIFICATION EXAMPLES (4 min)
- Getting tools: EXTERNAL ✓
- Removing old die: INTERNAL ✗
- Paperwork: EXTERNAL ✓
- Tightening bolts: INTERNAL ✗
- Pre-heating die: EXTERNAL ✓

THE SURPRISE (2 min)
- 30-50% of "internal" work is actually external
- People do it during stoppage out of habit
- Moving it = immediate time savings
- Zero cost, zero technology needed

CLASSIFICATION EXERCISE (4 min)
[Screen share: Case study steps]
- Classify each step together
- Discuss borderline cases
- Calculate internal vs external split

USING THE SOFTWARE (2 min)
[Screen share: ChangeOverOptimizer SMED module]
- Marking steps as internal/external
- Viewing the breakdown
- Identifying quick wins
```

**Exercise:** Classify all steps from your documented changeover.

---

### Lesson 3.5: Stage 3 - Convert Internal to External (15 min)

**Video Script Outline:**

```
THE CONVERSION MINDSET (3 min)
- Challenge every internal step
- Ask: "How could this be done beforehand?"
- Ask: "How could this be done afterward?"

COMMON CONVERSIONS (5 min)
1. Pre-staging: Next tool/material ready before stop
2. Pre-heating: Warm up molds while running
3. Pre-setting: Adjust offline, not on machine
4. Parallel prep: Another person readies materials
5. Checklists: Verify everything ready before stop

EXAMPLE CONVERSIONS (4 min)
[Case study]
- Before: Get die from storage (3 min, internal)
- After: Die staged at machine (0 min, external)
- Savings: 3 minutes per changeover

- Before: Adjust settings on machine (5 min, internal)
- After: Pre-set on rolling cart (5 min, external)
- Savings: 5 minutes per changeover

RESISTANCE TO CHANGE (2 min)
- "We've always done it this way"
- "There's no space"
- "We don't have enough people"
- Counter: Calculate the cost of not changing

ACTION PLANNING (1 min)
- List all possible conversions
- Estimate savings for each
- Prioritize by ease vs impact
```

**Exercise:** Identify 3 internal steps that could be converted to external in your operation.

---

### Lesson 3.6: Stage 4 - Streamline All Operations (10 min)

**Video Script Outline:**

```
WHAT'S LEFT? (2 min)
- True internal operations (must stop machine)
- External operations (still take time)
- Both can be streamlined

STREAMLINING TECHNIQUES (5 min)
1. Parallel operations: Two people instead of one
2. Functional clamps: One-turn vs many bolts
3. Intermediate jigs: Eliminate adjustments
4. Elimination: Remove unnecessary steps
5. Mechanization: Where justified by volume

EXAMPLE: BOLT REDUCTION (2 min)
- Before: 12 bolts, 30 seconds each = 6 minutes
- After: 4 quick-release clamps, 5 seconds each = 20 seconds
- Investment: €500 for clamps
- Payback: 2 weeks at 6 changeovers/day

PRACTICAL LIMITS (1 min)
- Diminishing returns after 80% reduction
- Investment may not justify final 20%
- Know when to stop and move to next opportunity
```

---

### Lesson 3.7: The 8 SMED Techniques (10 min)

**Video Script Outline:**

```
8 TECHNIQUES OVERVIEW (1 min)
- Shingo identified 8 core techniques
- Applicable across industries
- Quick reference for improvement ideas

TECHNIQUE 1-4 (4 min)
1. Parallel operations
   - Split tasks between two people
   - Reduce elapsed time by 40-50%

2. Functional clamps
   - One-turn fasteners
   - Quick-release mechanisms
   - Eliminate threads where possible

3. Intermediate jigs
   - Pre-set offline
   - Snap into place on machine
   - Eliminate on-machine adjustment

4. Eliminate adjustments
   - Use fixed settings/stops
   - Numerical dials not "feel"
   - Standard positions marked

TECHNIQUE 5-8 (4 min)
5. Mechanization
   - Powered clamping
   - Automated positioning
   - Where volume justifies

6. Standardization
   - Same bolt sizes
   - Same tool heights
   - Interchangeable components

7. Preparation checklist
   - Everything ready before stop
   - Verified and staged
   - No searching or waiting

8. Skill development
   - Train all operators
   - Practice makes faster
   - Standard work

QUICK REFERENCE CARD (1 min)
- Download 8 Techniques card
- Post at workstations
- Use for improvement brainstorming
```

**Deliverable:** 8 SMED Techniques Quick Reference Card (PDF)

---

## Module 4: Implementation

### Lesson 4.1: Building the Business Case (15 min)

**Video Script Outline:**

```
WHY YOU NEED A BUSINESS CASE (2 min)
- Gets management buy-in
- Secures resources
- Creates accountability
- Measures success

CALCULATING CURRENT COST (4 min)
[Screen share: ROI Calculator]
- Changeover frequency × duration × cost/hour
- Don't forget hidden costs
- Example: 6 × 45 min × €100/hr = €450/day = €117K/year

PROJECTING SAVINGS (4 min)
- Conservative: 30% reduction
- Moderate: 50% reduction
- Aggressive: 70% reduction
- Use moderate for planning

CALCULATING ROI (3 min)
- Investment needed
- Annual savings
- Payback period
- ROI percentage
- Example: €5K investment, €58K savings = 1-month payback

PRESENTING TO MANAGEMENT (2 min)
- Lead with the money
- Show comparable case studies
- Propose a pilot
- Define success criteria
```

**Deliverable:** ROI Calculator (Excel)

---

### Lesson 4.2: ROI Calculation Deep Dive (10 min)

**Video Script Outline:**

```
THE ROI CALCULATOR (3 min)
[Screen share: Excel ROI Calculator]
- Input cells explained
- Calculation logic
- Output summary

WORKED EXAMPLE (4 min)
- Scenario: 6 changeovers/day, 45 min each
- Current cost calculation
- 50% reduction target
- Investment estimation
- ROI and payback result

SENSITIVITY ANALYSIS (2 min)
- What if only 30% reduction?
- What if 6 changeovers becomes 10?
- Building confidence in projections

COMMON QUESTIONS (1 min)
- "What cost per hour should I use?"
- "Should I include labor?"
- "What about quality improvements?"
```

**Exercise:** Complete ROI calculation for your operation.

---

### Lesson 4.3: Project Planning (10 min)

**Video Script Outline:**

```
CHOOSING A PILOT (3 min)
- High impact: Frequent changeovers
- Visible: Others will see success
- Winnable: Not too complex
- Willing: Team wants to improve

PROJECT TIMELINE (3 min)
Week 1: Assessment and data collection
Week 2-3: SMED analysis and planning
Week 4-6: Implement quick wins
Week 7-8: Implement investments
Week 9+: Standardize and sustain

PROJECT TEAM (2 min)
- Sponsor: Management support
- Lead: Drives day-to-day
- Operators: Do the work
- Support: Maintenance, engineering

SUCCESS CRITERIA (2 min)
- Specific: "Reduce from 45 to 20 minutes"
- Measurable: Timed changeovers
- Time-bound: "Within 8 weeks"
```

**Deliverable:** Project Charter Template

---

### Lesson 4.4: Change Management (15 min)

**Video Script Outline:**

```
WHY CHANGE IS HARD (3 min)
- "We've always done it this way"
- Fear of looking bad
- Extra work during transition
- Lack of trust

GETTING BUY-IN (4 min)
- Involve operators from day 1
- Their ideas, not imposed solutions
- Explain the "why"
- Share success stories

HANDLING RESISTANCE (4 min)
- Listen to concerns genuinely
- Address practical issues
- Start with willing participants
- Let success speak

COMMUNICATION PLAN (2 min)
- Announce project and goals
- Regular updates (weekly)
- Celebrate quick wins
- Share before/after data

SUSTAINING CHANGE (2 min)
- Don't declare victory too early
- Build into daily routine
- Audit and feedback
- Recognize improvements
```

---

### Lesson 4.5: Common Pitfalls (10 min)

**Video Script Outline:**

```
PITFALL 1: NO BASELINE (2 min)
- Can't prove improvement without measurement
- Fix: Always measure before

PITFALL 2: SKIPPING OBSERVATION (2 min)
- Assuming you know what happens
- Reality is always different
- Fix: Watch and document every time

PITFALL 3: BIG BANG APPROACH (2 min)
- Trying to fix everything at once
- Overwhelms team, creates chaos
- Fix: Quick wins first, then investments

PITFALL 4: IGNORING OPERATORS (2 min)
- Engineering solutions without input
- Won't be used correctly
- Fix: Operators design solutions

PITFALL 5: DECLARING VICTORY (2 min)
- One good changeover ≠ improvement
- Old habits return quickly
- Fix: Standard work and audits
```

---

## Module 5: Standard Work & Sustainability

### Lesson 5.1: Why Standard Work Matters (10 min)

**Video Script Outline:**

```
THE BACKSLIDE PROBLEM (3 min)
- Improvements fade without standards
- Different operators, different methods
- Back to old times within months

WHAT IS STANDARD WORK? (3 min)
- The current best way to do the job
- Documented step by step
- Time for each step
- Visual and accessible

BENEFITS OF STANDARDIZATION (2 min)
- Consistent results
- Training made easy
- Baseline for improvement
- Problem visibility

STANDARD WORK IS NOT FINAL (2 min)
- "Standard" today, improved tomorrow
- Living document
- Operators can suggest changes
- Continuous improvement built in
```

---

### Lesson 5.2: Creating Changeover Standards (15 min)

**Video Script Outline:**

```
COMPONENTS OF A STANDARD (3 min)
- Step-by-step procedure
- Standard time per step
- Total standard time
- Tools required
- Safety notes
- Visual aids

CREATING THE DOCUMENT (5 min)
[Screen share: Standard Work Template]
- Header information
- Steps with times
- Photos/diagrams
- Tool checklist

USING THE SOFTWARE (4 min)
[Screen share: ChangeOverOptimizer]
- Generate standard from SMED study
- Export printable checklist
- Link to changeover type

POSTING AND ACCESS (2 min)
- At the workstation
- Laminated for durability
- QR code to digital version
- Easy to update

REVIEW CYCLE (1 min)
- Review quarterly
- Update when methods change
- Capture improvements
```

**Deliverable:** Standard Work Template

---

### Lesson 5.3: Training Operators (10 min)

**Video Script Outline:**

```
TRAINING APPROACH (3 min)
- Show: Demonstrate correct method
- Tell: Explain why each step matters
- Do: Let them practice
- Check: Observe and give feedback

TRAINING MATERIALS (3 min)
- Standard work document
- Video of correct method
- One-page quick reference
- Hands-on practice

CERTIFICATION APPROACH (2 min)
- Initial training complete
- Supervised practice
- Independent execution (observed)
- Signed off as qualified

ONGOING DEVELOPMENT (2 min)
- Cross-train multiple changeovers
- Refresher when standards change
- Best practice sharing
```

**Deliverable:** Operator Training Checklist

---

### Lesson 5.4: Sustaining Gains (10 min)

**Video Script Outline:**

```
THE AUDIT SYSTEM (3 min)
- Regular changeover audits
- Compare actual to standard
- Identify drift
- Immediate correction

HOW TO AUDIT (3 min)
[Screen share: Audit Form]
- Time the changeover
- Compare to standard
- Note deviations
- Discuss with operator

FREQUENCY (2 min)
- Weekly for first month
- Monthly after stable
- Random spot checks
- After any problem

CONTINUOUS IMPROVEMENT (2 min)
- Audit findings → improvements
- Operator suggestions welcome
- Regular review meetings
- Update standards when better way found
```

**Deliverable:** Changeover Audit Form

---

## Module 6: Certification

### Lesson 6.1: Final Assessment (15 min)

**Format:** 20 multiple choice questions

**Topics Covered:**
- Changeover fundamentals (4 questions)
- Sequence optimization (4 questions)
- SMED methodology (6 questions)
- Implementation (4 questions)
- Standard work (2 questions)

**Sample Questions:**

```
Q: What does SMED stand for?
A) Single-Minute Exchange of Die ✓
B) Setup Management and Efficiency Development
C) Standard Method for Equipment Downtime
D) Shingo Method for Engineering Delivery

Q: Which SMED stage provides the quickest improvement?
A) Stage 1: Observe
B) Stage 2: Separate internal/external ✓
C) Stage 3: Convert
D) Stage 4: Streamline

Q: A step that CAN be done while the machine is running is called:
A) Internal
B) External ✓
C) Parallel
D) Sequential

Q: The changeover hierarchy prioritizes attributes by:
A) Alphabetical order
B) Changeover time (longest first) ✓
C) Product popularity
D) Customer importance
```

**Passing Score:** 70% (14/20 correct)
**Retakes:** Unlimited

---

### Lesson 6.2: Case Study Exercise (45 min)

**Scenario:**

> ABC Plastics runs an injection molding line producing 8 different products. 
> Current changeover takes 90 minutes on average. They do 4 changeovers per day.
> The line runs €200/hour when productive.

**Tasks:**

1. **Calculate Current Cost** (10 min)
   - Annual changeover hours
   - Annual changeover cost
   - Show your work

2. **Design Changeover Hierarchy** (10 min)
   - Given: Products vary by mold, material, color
   - Mold change: 45 min
   - Material change: 25 min
   - Color change: 15 min
   - Define hierarchy

3. **SMED Analysis** (15 min)
   - Given: 20 changeover steps (provided)
   - Classify each as internal/external
   - Identify 3 conversions
   - Estimate potential savings

4. **Business Case** (10 min)
   - Investment needed: €8,000
   - Target: 50% reduction
   - Calculate ROI and payback

**Submission:**
- Completed worksheet
- Brief summary (1 page)
- Reviewed by instructor

---

### Certificate Award

Upon successful completion:

**Certificate:**
```
─────────────────────────────────────────────────────────

           CHANGEOVER OPTIMIZATION PRACTITIONER
           
                    This certifies that
                    
                    [YOUR NAME]
                    
           has successfully completed the requirements
           for Changeover Optimization Practitioner
           
           Date: [DATE]
           Certificate ID: [ID]
           
           Issued by: ChangeOverOptimizer
           
─────────────────────────────────────────────────────────
```

**LinkedIn Badge:** Digital badge for profile

**Practitioner Directory:** Optional listing (name, location, contact)

---

## Course Production Notes

### Video Production

**Format:**
- 1080p minimum (4K preferred)
- Clear audio (external mic required)
- Screen recordings for software
- Talking head for concepts
- Mix of slides and demos

**Style:**
- Professional but approachable
- Practical, not academic
- Real examples and stories
- Keep energy up

**Length:**
- Individual videos: 5-15 minutes
- Total: 4-6 hours
- Shorter is better (can always add)

### Platform Setup (Teachable)

**Course Settings:**
- Drip content: No (all available immediately)
- Completion tracking: Yes
- Certificate: Auto-generate on completion
- Pricing: €99 one-time

**Assessment Setup:**
- Quiz after each module (optional)
- Final assessment (required)
- Case study upload (required)

---

*Curriculum v1.0 | December 2024*
