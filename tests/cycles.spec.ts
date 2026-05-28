import { describe, expect, it } from 'vitest';
import { CyclesDFS, CyclesJohnson, DiGraph, DiGraphDict, VertexWithId } from '../src/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = Record<string, any>;

function* createRawVertices(...ids: string[]): Generator<VertexWithId<Vertex>> {
	for (const id of ids) {
		yield {
			id,
			vertex: {}
		};
	}
}

describe('Graph cycles', () => {
	describe('When providing a graph with cycles', () => {
		it('Should detect cycles in the graph', () => {
			const dict: DiGraphDict<Vertex> = {
				vertices: {
					a: {},
					b: {},
					c: {},
					d: {}
				},
				edges: {
					a: { b: undefined as never, c: undefined as never },
					b: { c: undefined as never, d: undefined as never },
					c: { a: undefined as never },
					d: {}
				}
			};
			const graph = DiGraph.fromDict(dict);
			const cycles = new CyclesJohnson(graph);
			expect(cycles.hasCycles()).to.equal(true);
			const foundCycles = Array.from(cycles.findCycles());
			expect(foundCycles).to.deep.equal([
				['a', 'b', 'c'],
				['a', 'c']
			]);
		});
		it('Should detect cycles in the graph with depth limit', () => {
			const dict: DiGraphDict<Vertex> = {
				vertices: {
					a: {},
					b: {},
					c: {},
					d: {}
				},
				edges: {
					a: { b: undefined as never, c: undefined as never },
					b: { c: undefined as never, d: undefined as never },
					c: { a: undefined as never },
					d: {}
				}
			};
			const graph = DiGraph.fromDict(dict);
			const cycles = new CyclesDFS(graph);
			expect(cycles.hasCycles(1)).to.equal(false);
			expect(cycles.hasCycles(2)).to.equal(true);
			const foundCycles = Array.from(cycles.findCycles(2));
			expect(foundCycles).to.deep.equal([['a', 'c']]);
		});
	});

	describe('When providing a graph without cycles', () => {
		it('Should not detect cycles in the graph', () => {
			const dict: DiGraphDict<Vertex> = {
				vertices: {
					a: {},
					b: {},
					c: {},
					d: {}
				},
				edges: {
					a: { b: undefined as never, c: undefined as never },
					b: { c: undefined as never, d: undefined as never },
					c: {},
					d: {}
				}
			};
			const graph = DiGraph.fromDict(dict);
			const cycles = new CyclesJohnson(graph);
			expect(cycles.hasCycles()).to.equal(false);
			const foundCycles = cycles.findCycles();
			expect(Array.from(foundCycles)).to.deep.equal([]);
		});
	});

	describe('When search for circular dependencies in the graph', () => {
		describe('When no vertices have edges directly pointing to each other', () => {
			it('should not detect a cycle', () => {
				const digraph = new DiGraph<Vertex>();
				const cycles = new CyclesJohnson(digraph);
				const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

				digraph.addVertices(vertexA, vertexB, vertexC);

				digraph.addEdges({ from: vertexA.id, to: vertexB.id });
				expect(cycles.hasCycles()).to.equal(false);

				digraph.addEdges({ from: vertexB.id, to: vertexC.id });
				expect(cycles.hasCycles()).to.equal(false);
			});
		});

		describe('When there is only one cycle in the graph', () => {
			describe('When the cycle is starting from the root vertex', () => {
				describe('When using infinite depth limit for detection', () => {
					it('should detect a cycle of depth 1 between vertices with edges pointing directly to each other', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);
						const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

						digraph.addVertices(vertexB, vertexA);
						digraph.addEdges({ from: vertexA.id, to: vertexB.id });

						expect(cycles.hasCycles()).to.equal(false);

						digraph.addEdges({ from: vertexB.id, to: vertexA.id });

						expect(cycles.hasCycles()).to.equal(true);
						const foundCycles = Array.from(cycles.findCycles());
						expect(foundCycles).to.deep.equal([['b', 'a']]);
					});

					it('should detect a cycle of depth 2 with indirect edges pointing to each other', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);
						const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
							...createRawVertices('a', 'b', 'c', 'd', 'e')
						];

						digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
						digraph.addEdges({ from: vertexA.id, to: vertexB.id });
						digraph.addEdges({ from: vertexB.id, to: vertexC.id });
						digraph.addEdges({ from: vertexC.id, to: vertexD.id });
						expect(cycles.hasCycles()).to.equal(false);

						// D ----> A => cycle between A and D traversing B, C
						digraph.addEdges({ from: vertexD.id, to: vertexA.id });
						expect(cycles.hasCycles()).to.equal(true);
						const foundCycles = Array.from(cycles.findCycles());
						expect(foundCycles).to.deep.equal([['a', 'b', 'c', 'd']]);
					});

					it('should detect cyclic paths of any given depth', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);
						const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

						digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
						digraph.addEdges({ from: vertexC.id, to: vertexD.id });
						digraph.addEdges({ from: vertexB.id, to: vertexC.id });
						digraph.addEdges({ from: vertexA.id, to: vertexB.id });
						// D ----> A => cycle between A and D traversing B, C
						digraph.addEdges({ from: vertexD.id, to: vertexA.id });

						const foundCycles = Array.from(cycles.findCycles());
						expect(foundCycles).to.deep.equal([['a', 'b', 'c', 'd']]);
					});

					it('should keep only one occurrence of a same cyclic path', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);

						const [fileA, fileB, fileC] = [...createRawVertices('A.js', 'B.js', 'C.js')];

						digraph.addVertices(fileA, fileB, fileC);
						digraph.addEdges({ from: fileA.id, to: fileB.id });
						digraph.addEdges({ from: fileB.id, to: fileC.id });
						digraph.addEdges({ from: fileC.id, to: fileA.id });

						const foundCycles = Array.from(cycles.findCycles());
						expect(foundCycles.length).to.equal(1);
						expect(foundCycles).to.deep.equal([['A.js', 'B.js', 'C.js']]);
					});

					it('should only return nodes involved in the cycle when dealing with direct circular dependency', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);
						const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

						digraph.addVertices(vertexC, vertexA, vertexB);
						digraph.addEdges({ from: vertexA.id, to: vertexB.id });
						digraph.addEdges({ from: vertexB.id, to: vertexC.id });
						expect(cycles.hasCycles()).to.equal(false);

						digraph.addEdges({ from: vertexB.id, to: vertexA.id });

						const foundCycles = Array.from(cycles.findCycles());
						expect(foundCycles).to.deep.equal([['a', 'b']]);
					});

					describe('When dealing with an indirect circular dependency', () => {
						it('scenario n°1: should only keep nodes involved in the cycle', () => {
							const digraph = new DiGraph<Vertex>();
							const cycles = new CyclesJohnson(digraph);
							const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
								...createRawVertices('a', 'b', 'c', 'd', 'e')
							];

							digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
							digraph.addEdges({ from: vertexA.id, to: vertexB.id });
							digraph.addEdges({ from: vertexB.id, to: vertexC.id });
							digraph.addEdges({ from: vertexB.id, to: vertexD.id });
							expect(cycles.hasCycles()).to.equal(false);

							digraph.addEdges({ from: vertexC.id, to: vertexA.id });
							digraph.addEdges({ from: vertexC.id, to: vertexE.id });

							const foundCycles = Array.from(cycles.findCycles());
							expect(cycles.hasCycles()).to.equal(true);
							expect(foundCycles).to.deep.equal([['a', 'b', 'c']]);
						});

						it('scenario n°2: should only keep nodes involved in the cycle', () => {
							const digraph = new DiGraph<Vertex>();
							const cycles = new CyclesJohnson(digraph);
							const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexZ] = [
								...createRawVertices('a', 'b', 'c', 'd', 'e', 'z')
							];

							digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE, vertexZ);

							digraph.addEdges({ from: vertexA.id, to: vertexB.id });
							digraph.addEdges({ from: vertexA.id, to: vertexC.id });
							digraph.addEdges({ from: vertexB.id, to: vertexD.id });
							digraph.addEdges({ from: vertexB.id, to: vertexE.id });
							digraph.addEdges({ from: vertexD.id, to: vertexZ.id });
							digraph.addEdges({ from: vertexE.id, to: vertexA.id });

							const foundCycles = Array.from(cycles.findCycles());
							expect(foundCycles).to.deep.equal([['a', 'b', 'e']]);
						});
					});
				});

				describe('When providing a max depth limit for detection', () => {
					it('should not detect any cycle as the specified depth is zero', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesDFS(digraph);
						const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

						digraph.addVertices(vertexA, vertexB);
						digraph.addEdges({ from: vertexA.id, to: vertexB.id });
						digraph.addEdges({ from: vertexB.id, to: vertexA.id });
						expect(cycles.hasCycles(0)).to.equal(false);
					});

					it('should detect the cycle once the specified depth is greather than or equal to the depth of the cycle', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesDFS(digraph);
						const cyclesJohnson = new CyclesJohnson(digraph);
						const [vertexA, vertexB, vertexC, vertexD] = [
							...createRawVertices('a', 'b', 'c', 'd', 'e')
						];

						digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
						digraph.addEdges({ from: vertexA.id, to: vertexB.id });
						digraph.addEdges({ from: vertexB.id, to: vertexC.id });
						digraph.addEdges({ from: vertexC.id, to: vertexD.id });
						expect(cycles.hasCycles()).to.equal(false);
						expect(cyclesJohnson.hasCycles()).to.equal(false);

						digraph.addEdges({ from: vertexD.id, to: vertexA.id });
						expect(cycles.hasCycles(0)).to.equal(false);
						expect(cycles.hasCycles(1)).to.equal(false);
						expect(cycles.hasCycles(2)).to.equal(false);
						expect(cycles.hasCycles(3)).to.equal(false);
						expect(cycles.hasCycles(4)).to.equal(true);
						expect(cycles.hasCycles(20)).to.equal(true);
						expect(cyclesJohnson.hasCycles()).to.equal(true);
					});
				});
			});
		});

		describe('When there are many circular dependencies in the graph', () => {
			describe('When any cycle is starting other than from the root vertex', () => {
				describe('When only one direct cycle should be detected', () => {
					it('scenario n°1: should only keep vertices involved', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);
						const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
							...createRawVertices('a', 'b', 'c', 'd', 'e')
						];

						digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);

						// root node as it was added first in the graph
						digraph.addEdges({ from: vertexA.id, to: vertexE.id });

						// other vertices that should not be included in the cycle
						digraph.addEdges({ from: vertexC.id, to: vertexA.id });
						digraph.addEdges({ from: vertexB.id, to: vertexC.id });

						// cycle here (C <-> D)
						digraph.addEdges({ from: vertexC.id, to: vertexD.id });
						digraph.addEdges({ from: vertexD.id, to: vertexC.id });

						const foundCycles = Array.from(cycles.findCycles());
						expect(cycles.hasCycles()).to.equal(true);
						expect(foundCycles).to.deep.equal([['c', 'd']]);
					});

					it('scenario n°2: should only keep vertices involved', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);
						const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
							...createRawVertices('a', 'b', 'c', 'd', 'e', 'f')
						];

						digraph.addVertices(vertexF, vertexC, vertexD, vertexA, vertexB, vertexE);
						digraph.addEdges({ from: vertexF.id, to: vertexA.id });
						digraph.addEdges({ from: vertexB.id, to: vertexA.id });
						digraph.addEdges({ from: vertexD.id, to: vertexA.id });
						digraph.addEdges({ from: vertexC.id, to: vertexB.id });
						digraph.addEdges({ from: vertexE.id, to: vertexD.id });

						// cycle C <-> F
						digraph.addEdges({ from: vertexC.id, to: vertexF.id });
						digraph.addEdges({ from: vertexF.id, to: vertexC.id });

						const foundCycles = Array.from(cycles.findCycles());
						expect(cycles.hasCycles()).to.equal(true);
						expect(foundCycles).to.deep.equal([['f', 'c']]);
					});

					it('scenario n°3: should only keep vertices involved', () => {
						const digraph = new DiGraph<Vertex>();
						const cycles = new CyclesJohnson(digraph);
						const [vertexA, vertexB, vertexP, vertexD, vertexX] = [
							...createRawVertices('a', 'b', 'p', 'd', 'x')
						];

						digraph.addVertices(vertexA, vertexB, vertexP, vertexD, vertexX);

						digraph.addEdges({ from: vertexA.id, to: vertexB.id });
						digraph.addEdges({ from: vertexA.id, to: vertexP.id });
						digraph.addEdges({ from: vertexB.id, to: vertexD.id });
						digraph.addEdges({ from: vertexP.id, to: vertexD.id });
						digraph.addEdges({ from: vertexD.id, to: vertexX.id });
						expect(cycles.hasCycles()).to.equal(false);

						digraph.addEdges({ from: vertexX.id, to: vertexA.id });
						const foundCycles = Array.from(cycles.findCycles());
						expect(foundCycles).to.deep.equal([
							['a', 'b', 'd', 'x'],
							['a', 'p', 'd', 'x']
						]);
					});
				});

				it('should keep two connected cycles separated', () => {
					const digraph = new DiGraph<Vertex>();
					const cycles = new CyclesJohnson(digraph);
					const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

					digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

					// first cycle (A -> B -> C -> A)
					digraph.addEdges({ from: vertexA.id, to: vertexB.id });
					digraph.addEdges({ from: vertexB.id, to: vertexC.id });
					digraph.addEdges({ from: vertexC.id, to: vertexA.id });

					// second cycle (C <-> D)
					digraph.addEdges({ from: vertexC.id, to: vertexD.id });
					digraph.addEdges({ from: vertexD.id, to: vertexC.id });

					// third and global cycle formed (A -> B -> C -> D)
					// but we want to keep both cycles separated to facilitate the cycle
					// resolution
					const foundCycles = cycles.findCycles();
					expect(cycles.hasCycles()).to.equal(true);
					expect([...foundCycles]).to.deep.equal([
						['a', 'b', 'c'],
						['c', 'd']
					]);
				});

				it('should detect both independent cycles', () => {
					const digraph = new DiGraph<Vertex>();
					const cycles = new CyclesJohnson(digraph);
					const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
						...createRawVertices('a', 'b', 'c', 'd', 'e')
					];

					digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);

					digraph.addEdges({ from: vertexA.id, to: vertexB.id });
					digraph.addEdges({ from: vertexA.id, to: vertexD.id });

					// first cycle (B <-> C)
					digraph.addEdges({ from: vertexC.id, to: vertexB.id });
					digraph.addEdges({ from: vertexB.id, to: vertexC.id });

					// second cycle (D <-> E)
					digraph.addEdges({ from: vertexE.id, to: vertexD.id });
					digraph.addEdges({ from: vertexD.id, to: vertexE.id });

					const foundCycles = Array.from(cycles.findCycles());
					expect(cycles.hasCycles()).to.equal(true);
					expect([...foundCycles]).to.deep.equal([
						['b', 'c'],
						['d', 'e']
					]);
				});
			});
		});
	});
});
