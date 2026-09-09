import {Composition} from 'remotion';
import {Film} from './Film';
import {Benchmark1Character, BENCHMARK1_DURATION} from './benchmarks/Benchmark1Character';
import {Benchmark2Scientific, BENCHMARK2_DURATION} from './benchmarks/Benchmark2Scientific';
import {Benchmark3DataExplainer, BENCHMARK3_DURATION} from './benchmarks/Benchmark3DataExplainer';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Connection"
        component={Film}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Benchmark1-Character"
        component={Benchmark1Character}
        durationInFrames={BENCHMARK1_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Benchmark2-Scientific"
        component={Benchmark2Scientific}
        durationInFrames={BENCHMARK2_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Benchmark3-DataExplainer"
        component={Benchmark3DataExplainer}
        durationInFrames={BENCHMARK3_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
