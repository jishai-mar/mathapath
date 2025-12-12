-- Add columns to exercise_attempts for tracking mistake patterns and explanation variants
ALTER TABLE public.exercise_attempts 
ADD COLUMN IF NOT EXISTS misconception_tag text,
ADD COLUMN IF NOT EXISTS explanation_variant integer DEFAULT 1;

-- Update exercises with clean LaTeX formatting (remove redundant $ wrappers, standardize)
UPDATE public.exercises SET
  question = 'Solve for x: 2x + 5 = 13',
  correct_answer = '4',
  explanation = 'Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4.',
  hints = ARRAY['Isolate the variable term', 'Subtract 5 from both sides first']
WHERE id = 'd3694c3c-6576-4398-8f51-1400d3707955';

UPDATE public.exercises SET
  question = 'Solve for x: 3(x - 2) = 15',
  correct_answer = '7',
  explanation = 'Distribute: 3x - 6 = 15. Add 6: 3x = 21. Divide by 3: x = 7.',
  hints = ARRAY['First distribute the 3', 'Then isolate x']
WHERE id = '4df0b242-1881-4c23-9555-a28bad4830bc';

UPDATE public.exercises SET
  question = 'Solve for x: \frac{x + 3}{2} = 7',
  correct_answer = '11',
  explanation = 'Multiply both sides by 2: x + 3 = 14. Subtract 3: x = 11.',
  hints = ARRAY['Eliminate the fraction first', 'Multiply both sides by 2']
WHERE id = '716ebbb7-c950-42dc-94cd-a00b88261454';

UPDATE public.exercises SET
  question = 'Solve for x: 4x - 3(x + 2) = 5x + 4',
  correct_answer = '-2.5',
  explanation = 'Distribute: 4x - 3x - 6 = 5x + 4. Simplify: x - 6 = 5x + 4. Solve: -4x = 10, so x = -2.5.',
  hints = ARRAY['Distribute the -3', 'Combine like terms on the left']
WHERE id = 'e7e79891-bfa9-401d-b6d7-3ab49be0ee54';

UPDATE public.exercises SET
  question = 'Solve: x^2 - 9 = 0',
  correct_answer = '3 or -3',
  explanation = 'Factor as (x-3)(x+3) = 0, so x = 3 or x = -3.',
  hints = ARRAY['Add 9 to both sides', 'Take the square root of both sides, remember ± for square roots']
WHERE id = '10230d37-fd37-4a44-82ba-86abbffad19f';