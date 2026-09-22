import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders Diff Script generator and Preset/Custom controls', () => {
  render(<App />);
  const titleElement = screen.getByRole('heading', { name: /diff script/i });
  expect(titleElement).toBeInTheDocument();
  const customButtons = screen.getAllByRole('button', { name: /custom/i });
  expect(customButtons.length).toBeGreaterThan(0);
});

test('toggles to custom path and generates diff commands with custom path', () => {
  render(<App />);
  const [sourceCustomBtn] = screen.getAllByRole('button', { name: /custom/i });
  fireEvent.click(sourceCustomBtn);

  const customPathInput = screen.getByPlaceholderText(/e\.g\. C:\\Deployments\\sql or Q:\\Custom\\sql/i);
  expect(customPathInput).toBeInTheDocument();

  fireEvent.change(customPathInput, { target: { value: 'C:\\MyRepo\\sql' } });

  const planTextarea = screen.getByPlaceholderText(/paste deployment script instructions here/i);
  fireEvent.change(planTextarea, { target: { value: 'Deploying update_table.sql and package.apx' } });

  const terminalOutput = screen.getByPlaceholderText(/commands appear here after you paste a plan/i);
  expect(terminalOutput.value).toContain('diff -iwc');
  expect(terminalOutput.value).toContain('"C:\\MyRepo\\sql\\update_table.sql"');
  expect(terminalOutput.value).toContain('"C:\\MyRepo\\apex\\package.apx"');
});

