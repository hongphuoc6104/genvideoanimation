import {Composition} from 'remotion';
import {Film} from './Film';
import {Benchmark1Character, BENCHMARK1_DURATION} from './benchmarks/Benchmark1Character';
import {Benchmark2Scientific, BENCHMARK2_DURATION} from './benchmarks/Benchmark2Scientific';
import {Benchmark3DataExplainer, BENCHMARK3_DURATION} from './benchmarks/Benchmark3DataExplainer';
import {ScientificPaperFilm, TOTAL_FRAMES as SCIENTIFIC_PAPER_DURATION} from './academic-paper/ScientificPaperFilm';
import {BenchmarkV2HumanExplainer, BENCHMARK_V2_HUMAN_DURATION} from './benchmarks/v2/BenchmarkV2HumanExplainer';
import {BenchmarkV2MechanicalMorph, BENCHMARK_V2_MECHANICAL_DURATION} from './benchmarks/v2/BenchmarkV2MechanicalMorph';
import {BenchmarkV2NetworkFlow, BENCHMARK_V2_NETWORK_DURATION} from './benchmarks/v2/BenchmarkV2NetworkFlow';
import {BenchmarkV3A, BENCHMARK_V3_A_DURATION} from './benchmarks/v3/BenchmarkV3A';
import {BenchmarkV3B, BENCHMARK_V3_B_DURATION} from './benchmarks/v3/BenchmarkV3B';
import {BenchmarkV3C, BENCHMARK_V3_C_DURATION} from './benchmarks/v3/BenchmarkV3C';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ScientificPaper-45s"
        component={ScientificPaperFilm}
        durationInFrames={SCIENTIFIC_PAPER_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
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
      <Composition
        id="BenchmarkV2-HumanExplainer"
        component={BenchmarkV2HumanExplainer}
        durationInFrames={BENCHMARK_V2_HUMAN_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BenchmarkV2-MechanicalMorph"
        component={BenchmarkV2MechanicalMorph}
        durationInFrames={BENCHMARK_V2_MECHANICAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BenchmarkV2-NetworkFlow"
        component={BenchmarkV2NetworkFlow}
        durationInFrames={BENCHMARK_V2_NETWORK_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BenchmarkV3A"
        component={BenchmarkV3A}
        durationInFrames={BENCHMARK_V3_A_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BenchmarkV3B"
        component={BenchmarkV3B}
        durationInFrames={BENCHMARK_V3_B_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BenchmarkV3C"
        component={BenchmarkV3C}
        durationInFrames={BENCHMARK_V3_C_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
