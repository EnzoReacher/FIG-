export type StepPermission = 'granted' | 'denied' | 'unavailable' | 'unknown';
export interface StepSource {
  permission(): Promise<StepPermission>;
  requestPermission(): Promise<StepPermission>;
  stepsForDay(day: string): Promise<number>;
}
export class MockStepSource implements StepSource {
  constructor(
    private readonly steps = 0,
    private readonly state: StepPermission = 'granted',
  ) {}
  async permission() {
    return this.state;
  }
  async requestPermission() {
    return this.state;
  }
  async stepsForDay() {
    return this.steps;
  }
}
