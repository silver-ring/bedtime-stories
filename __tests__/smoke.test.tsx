import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

test('RNTL 14 renders under the 0.86 jest preset', async () => {
  await render(<Text>hello</Text>);
  expect(screen.getByText('hello')).toBeTruthy();
});
