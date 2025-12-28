-- First clear all related data that references subtopics
DELETE FROM learning_profiles;
DELETE FROM user_subtopic_progress;
DELETE FROM learning_check_responses;
DELETE FROM theory_bookmarks;
DELETE FROM exercises;
DELETE FROM diagnostic_questions;

-- Now clear subtopics and topics
DELETE FROM subtopics;

-- Clear topic-related data
DELETE FROM user_topic_progress;
DELETE FROM diagnostic_tests;

-- Clear topics
DELETE FROM topics;

-- Insert all 19 topics from the booklet in order
INSERT INTO topics (id, name, description, icon, order_index) VALUES
  ('11111111-1111-1111-1111-111111111101', 'First-Degree Equations', 'Solve linear equations with one variable, two variables, and parameters', 'variable', 1),
  ('11111111-1111-1111-1111-111111111102', 'Fractions', 'Master fraction operations: multiplication, division, addition, and subtraction', 'divide', 2),
  ('11111111-1111-1111-1111-111111111103', 'Quadratic Equations', 'Solve quadratic equations using factoring, formula, and completing the square', 'square', 3),
  ('11111111-1111-1111-1111-111111111104', 'Higher Degree Equations', 'Biquadratic, radical, and polynomial equations of degree 3+', 'superscript', 4),
  ('11111111-1111-1111-1111-111111111105', 'Inequalities', 'First-degree, second-degree, quotient, and higher-degree inequalities', 'scale', 5),
  ('11111111-1111-1111-1111-111111111106', 'Exponents', 'Rules of exponents and exponential expressions', 'zap', 6),
  ('11111111-1111-1111-1111-111111111107', 'Exponential Equations', 'Solve equations with exponential terms', 'trending-up', 7),
  ('11111111-1111-1111-1111-111111111108', 'Logarithms', 'Logarithmic properties and calculations', 'log-in', 8),
  ('11111111-1111-1111-1111-111111111109', 'Logarithmic Equations', 'Solve equations involving logarithms', 'log-out', 9),
  ('11111111-1111-1111-1111-111111111110', 'Linear Functions', 'Graphs, slopes, intercepts, and equations of lines', 'move-diagonal', 10),
  ('11111111-1111-1111-1111-111111111111', 'Quadratic Functions', 'Parabolas: vertex, roots, domain, range, and transformations', 'circle-dot', 11),
  ('11111111-1111-1111-1111-111111111112', 'Polynomial Functions', 'Higher degree polynomial analysis and graphing', 'git-branch', 12),
  ('11111111-1111-1111-1111-111111111113', 'Rational Functions', 'Asymptotes, domains, and graphing rational expressions', 'git-merge', 13),
  ('11111111-1111-1111-1111-111111111114', 'Limits', 'Intuition and computation of limits', 'arrow-right-to-line', 14),
  ('11111111-1111-1111-1111-111111111115', 'Derivatives Basics', 'Definition, rules, and derivatives of polynomials', 'activity', 15),
  ('11111111-1111-1111-1111-111111111116', 'Derivative Applications', 'Tangent lines, extrema, and curve sketching', 'line-chart', 16),
  ('11111111-1111-1111-1111-111111111117', 'Chain Rule', 'Derivatives of composite functions', 'link', 17),
  ('11111111-1111-1111-1111-111111111118', 'Trigonometry Basics', 'Sine, cosine, tangent, and their properties', 'compass', 18),
  ('11111111-1111-1111-1111-111111111119', 'Trigonometric Equations', 'Solve equations involving trigonometric functions', 'sigma', 19);

-- Insert subtopics for First-Degree Equations
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220101', '11111111-1111-1111-1111-111111111101', 'One Variable Equations', 1),
  ('22222222-2222-2222-2222-222222220102', '11111111-1111-1111-1111-111111111101', 'Two Variable Systems', 2),
  ('22222222-2222-2222-2222-222222220103', '11111111-1111-1111-1111-111111111101', 'Equations with Parameters', 3);

-- Insert subtopics for Fractions
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220201', '11111111-1111-1111-1111-111111111102', 'Multiplying Fractions', 1),
  ('22222222-2222-2222-2222-222222220202', '11111111-1111-1111-1111-111111111102', 'Dividing Fractions', 2),
  ('22222222-2222-2222-2222-222222220203', '11111111-1111-1111-1111-111111111102', 'Adding Fractions', 3),
  ('22222222-2222-2222-2222-222222220204', '11111111-1111-1111-1111-111111111102', 'Subtracting Fractions', 4),
  ('22222222-2222-2222-2222-222222220205', '11111111-1111-1111-1111-111111111102', 'Complex Fractions', 5);

-- Insert subtopics for Quadratic Equations
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220301', '11111111-1111-1111-1111-111111111103', 'Standard Form', 1),
  ('22222222-2222-2222-2222-222222220302', '11111111-1111-1111-1111-111111111103', 'Factoring Method', 2),
  ('22222222-2222-2222-2222-222222220303', '11111111-1111-1111-1111-111111111103', 'Quadratic Formula', 3),
  ('22222222-2222-2222-2222-222222220304', '11111111-1111-1111-1111-111111111103', 'Completing the Square', 4),
  ('22222222-2222-2222-2222-222222220305', '11111111-1111-1111-1111-111111111103', 'Two Variable Quadratics', 5),
  ('22222222-2222-2222-2222-222222220306', '11111111-1111-1111-1111-111111111103', 'Quadratics with Parameters', 6);

-- Insert subtopics for Higher Degree Equations
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220401', '11111111-1111-1111-1111-111111111104', 'Biquadratic Equations', 1),
  ('22222222-2222-2222-2222-222222220402', '11111111-1111-1111-1111-111111111104', 'Radical Equations', 2),
  ('22222222-2222-2222-2222-222222220403', '11111111-1111-1111-1111-111111111104', 'Cubic Equations', 3),
  ('22222222-2222-2222-2222-222222220404', '11111111-1111-1111-1111-111111111104', 'Polynomial Factoring', 4);

-- Insert subtopics for Inequalities
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220501', '11111111-1111-1111-1111-111111111105', 'First-Degree Inequalities', 1),
  ('22222222-2222-2222-2222-222222220502', '11111111-1111-1111-1111-111111111105', 'Second-Degree Inequalities', 2),
  ('22222222-2222-2222-2222-222222220503', '11111111-1111-1111-1111-111111111105', 'Quotient Inequalities', 3),
  ('22222222-2222-2222-2222-222222220504', '11111111-1111-1111-1111-111111111105', 'Higher-Degree Inequalities', 4);

-- Insert subtopics for Exponents
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220601', '11111111-1111-1111-1111-111111111106', 'Laws of Exponents', 1),
  ('22222222-2222-2222-2222-222222220602', '11111111-1111-1111-1111-111111111106', 'Negative Exponents', 2),
  ('22222222-2222-2222-2222-222222220603', '11111111-1111-1111-1111-111111111106', 'Fractional Exponents', 3),
  ('22222222-2222-2222-2222-222222220604', '11111111-1111-1111-1111-111111111106', 'Simplifying Expressions', 4);

-- Insert subtopics for Exponential Equations
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220701', '11111111-1111-1111-1111-111111111107', 'Same Base Method', 1),
  ('22222222-2222-2222-2222-222222220702', '11111111-1111-1111-1111-111111111107', 'Using Logarithms', 2),
  ('22222222-2222-2222-2222-222222220703', '11111111-1111-1111-1111-111111111107', 'Exponential Growth/Decay', 3);

-- Insert subtopics for Logarithms
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220801', '11111111-1111-1111-1111-111111111108', 'Definition of Logarithm', 1),
  ('22222222-2222-2222-2222-222222220802', '11111111-1111-1111-1111-111111111108', 'Logarithm Properties', 2),
  ('22222222-2222-2222-2222-222222220803', '11111111-1111-1111-1111-111111111108', 'Change of Base', 3),
  ('22222222-2222-2222-2222-222222220804', '11111111-1111-1111-1111-111111111108', 'Natural Logarithm', 4);

-- Insert subtopics for Logarithmic Equations
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222220901', '11111111-1111-1111-1111-111111111109', 'Basic Log Equations', 1),
  ('22222222-2222-2222-2222-222222220902', '11111111-1111-1111-1111-111111111109', 'Log Property Applications', 2),
  ('22222222-2222-2222-2222-222222220903', '11111111-1111-1111-1111-111111111109', 'Mixed Exponential-Log', 3);

-- Insert subtopics for Linear Functions
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221001', '11111111-1111-1111-1111-111111111110', 'Slope and Y-Intercept', 1),
  ('22222222-2222-2222-2222-222222221002', '11111111-1111-1111-1111-111111111110', 'Point-Slope Form', 2),
  ('22222222-2222-2222-2222-222222221003', '11111111-1111-1111-1111-111111111110', 'Parallel and Perpendicular', 3),
  ('22222222-2222-2222-2222-222222221004', '11111111-1111-1111-1111-111111111110', 'Graphing Lines', 4);

-- Insert subtopics for Quadratic Functions
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221101', '11111111-1111-1111-1111-111111111111', 'Standard and Vertex Form', 1),
  ('22222222-2222-2222-2222-222222221102', '11111111-1111-1111-1111-111111111111', 'Finding Vertex', 2),
  ('22222222-2222-2222-2222-222222221103', '11111111-1111-1111-1111-111111111111', 'Roots and Discriminant', 3),
  ('22222222-2222-2222-2222-222222221104', '11111111-1111-1111-1111-111111111111', 'Graphing Parabolas', 4);

-- Insert subtopics for Polynomial Functions
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221201', '11111111-1111-1111-1111-111111111112', 'End Behavior', 1),
  ('22222222-2222-2222-2222-222222221202', '11111111-1111-1111-1111-111111111112', 'Zeros and Multiplicity', 2),
  ('22222222-2222-2222-2222-222222221203', '11111111-1111-1111-1111-111111111112', 'Polynomial Division', 3);

-- Insert subtopics for Rational Functions
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221301', '11111111-1111-1111-1111-111111111113', 'Domain and Asymptotes', 1),
  ('22222222-2222-2222-2222-222222221302', '11111111-1111-1111-1111-111111111113', 'Horizontal Asymptotes', 2),
  ('22222222-2222-2222-2222-222222221303', '11111111-1111-1111-1111-111111111113', 'Graphing Rationals', 3);

-- Insert subtopics for Limits
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221401', '11111111-1111-1111-1111-111111111114', 'Intuitive Limits', 1),
  ('22222222-2222-2222-2222-222222221402', '11111111-1111-1111-1111-111111111114', 'Limit Laws', 2),
  ('22222222-2222-2222-2222-222222221403', '11111111-1111-1111-1111-111111111114', 'Limits at Infinity', 3),
  ('22222222-2222-2222-2222-222222221404', '11111111-1111-1111-1111-111111111114', 'Epsilon-Delta Definition', 4);

-- Insert subtopics for Derivatives Basics
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221501', '11111111-1111-1111-1111-111111111115', 'Definition of Derivative', 1),
  ('22222222-2222-2222-2222-222222221502', '11111111-1111-1111-1111-111111111115', 'Power Rule', 2),
  ('22222222-2222-2222-2222-222222221503', '11111111-1111-1111-1111-111111111115', 'Sum and Product Rules', 3),
  ('22222222-2222-2222-2222-222222221504', '11111111-1111-1111-1111-111111111115', 'Quotient Rule', 4);

-- Insert subtopics for Derivative Applications
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221601', '11111111-1111-1111-1111-111111111116', 'Tangent Lines', 1),
  ('22222222-2222-2222-2222-222222221602', '11111111-1111-1111-1111-111111111116', 'Critical Points', 2),
  ('22222222-2222-2222-2222-222222221603', '11111111-1111-1111-1111-111111111116', 'Extrema and Optimization', 3),
  ('22222222-2222-2222-2222-222222221604', '11111111-1111-1111-1111-111111111116', 'Curve Sketching', 4);

-- Insert subtopics for Chain Rule
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221701', '11111111-1111-1111-1111-111111111117', 'Chain Rule Basics', 1),
  ('22222222-2222-2222-2222-222222221702', '11111111-1111-1111-1111-111111111117', 'Nested Functions', 2),
  ('22222222-2222-2222-2222-222222221703', '11111111-1111-1111-1111-111111111117', 'Implicit Differentiation', 3);

-- Insert subtopics for Trigonometry Basics
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221801', '11111111-1111-1111-1111-111111111118', 'Unit Circle', 1),
  ('22222222-2222-2222-2222-222222221802', '11111111-1111-1111-1111-111111111118', 'Sine and Cosine', 2),
  ('22222222-2222-2222-2222-222222221803', '11111111-1111-1111-1111-111111111118', 'Tangent and Cotangent', 3),
  ('22222222-2222-2222-2222-222222221804', '11111111-1111-1111-1111-111111111118', 'Trigonometric Identities', 4);

-- Insert subtopics for Trigonometric Equations
INSERT INTO subtopics (id, topic_id, name, order_index) VALUES
  ('22222222-2222-2222-2222-222222221901', '11111111-1111-1111-1111-111111111119', 'Basic Trig Equations', 1),
  ('22222222-2222-2222-2222-222222221902', '11111111-1111-1111-1111-111111111119', 'General Solutions', 2),
  ('22222222-2222-2222-2222-222222221903', '11111111-1111-1111-1111-111111111119', 'Multiple Angle Equations', 3);