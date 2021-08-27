import type * as d from '../../../declarations';
import { catchError } from '@utils';
import { isOutputTargetDistCollection } from '../output-utils';
import { join, relative } from 'path';
import { writeCollectionManifests } from '../output-collection';

export const outputCollection = async (
  config: d.Config,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  changedModuleFiles: d.Module[]
): Promise<void> => {
  const outputTargets = config.outputTargets.filter(isOutputTargetDistCollection);
  if (outputTargets.length === 0) {
    return;
  }

  const bundlingEventMessage = `generate collections${config.sourceMap ? ' + source maps' : ''}`;
  const timespan = buildCtx.createTimeSpan(`${bundlingEventMessage} started`, true);
  try {
    await Promise.all(
      changedModuleFiles.map(async (mod) => {
        const code = mod.staticSourceFileText;

        await Promise.all(
          outputTargets.map(async (o) => {
            const relPath = relative(config.srcDir, mod.jsFilePath);
            const filePath = join(o.collectionDir, relPath);
            await compilerCtx.fs.writeFile(filePath, code, { outputTargetType: o.type });

            if (mod.sourceMapPath) {
              const sourceMap = mod.sourceMapFileText;
              const relMapPath = relative(config.srcDir, mod.sourceMapPath);
              const sourceMapFilePath = join(o.collectionDir, relMapPath);
              await compilerCtx.fs.writeFile(sourceMapFilePath, sourceMap, { outputTargetType: o.type });
            }
          })
        );
      })
    );

    await writeCollectionManifests(config, compilerCtx, buildCtx, outputTargets);
  } catch (e) {
    catchError(buildCtx.diagnostics, e);
  }

  timespan.finish(`${bundlingEventMessage} finished`);
};
