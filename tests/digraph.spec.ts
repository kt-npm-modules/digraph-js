import { describe, expect, it } from 'vitest';
import { DiGraph, DiGraphDict, VertexWithId } from '../src/index';

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

describe('Directed Graph Implementation', () => {
	describe('When managing vertices in the graph', () => {
		describe('When adding vertices', () => {
			it('should add the given vertex to the graph', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA] = [...createRawVertices('a')];

				digraph.addVertices(vertexA);

				expect(digraph.hasVertex(vertexA.id)).to.equal(true);
				expect(Array.from(digraph.getVertexIds())).to.deep.equal([vertexA.id]);
			});

			it('should not add vertices already in the graph', () => {
				const digraph = new DiGraph<Vertex>();

				function expectGraphStructure() {
					const expectedDict: DiGraphDict<Vertex> = {
						vertices: {
							a: {},
							b: {},
							c: {}
						},
						edges: {}
					};
					const resultDict = digraph.toDict();
					expect(Object.keys(resultDict.vertices).length).to.equal(3);
					expect(resultDict).to.deep.equal(expectedDict);
				}

				const [vertexA, vertexB, vertexBis, vertexC] = [...createRawVertices('a', 'b', 'b', 'c')];

				expect(() => digraph.addVertices(vertexA, vertexB, vertexBis, vertexC)).to.throw(
					'Duplicate vertex ids found in the input: b'
				);

				digraph.addVertices(vertexA, vertexB, vertexC);
				expectGraphStructure();

				const duplicatedVertexB: VertexWithId<Vertex> = {
					id: 'b',
					vertex: { someComponent: 'x' }
				};

				expect(() => digraph.addVertices(duplicatedVertexB)).to.throw(
					'Vertices already exist in the graph: b'
				);
				expectGraphStructure();

				expect(() => digraph.addVertices(vertexB)).to.throw(
					'Vertices already exist in the graph: b'
				);

				expectGraphStructure();
			});
		});

		describe('When modifying vertices bodies', () => {
			describe('When updating vertices', () => {
				it('should only update one vertex with no dependencies', () => {
					const digraph = new DiGraph<Vertex>();
					const vertexA: VertexWithId<Vertex> = { id: 'a', vertex: {} };
					const vertexE: VertexWithId<Vertex> = { id: 'e', vertex: {} };
					const vertexB: VertexWithId<Vertex> = { id: 'b', vertex: {} };

					digraph.addVertices(vertexA, vertexB, vertexE);
					digraph.addEdges({ from: vertexE.id, to: vertexA.id });
					digraph.updateVertex({
						id: vertexB.id,
						vertex: {
							brandNewProp: 'newValue'
						}
					});

					expect(digraph.getVertex(vertexB.id)).to.deep.equal({
						brandNewProp: 'newValue'
					});
					expect(digraph.getVertex(vertexA.id)).to.deep.equal({});
					expect(digraph.getVertex(vertexE.id)).to.deep.equal({});

					digraph.updateVertex({
						id: vertexB.id,
						vertex: {
							otherProp: []
						}
					});
					expect(digraph.getVertex(vertexB.id)).to.deep.equal({
						otherProp: []
					});
				});
			});
		});

		describe('When deleting vertices', () => {
			describe('When no vertices depends on the deleted one', () => {
				it('should only delete the isolated vertex', () => {
					const digraph = new DiGraph<Vertex>();
					const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

					digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

					let expectedDict: DiGraphDict<Vertex> = {
						vertices: {
							a: vertexA.vertex,
							b: vertexB.vertex,
							c: vertexC.vertex,
							d: vertexD.vertex
						},
						edges: {}
					};
					expect(digraph.toDict()).to.deep.equal(expectedDict);

					digraph.deleteVertices(vertexC.id);

					expectedDict = {
						vertices: {
							a: vertexA.vertex,
							b: vertexB.vertex,
							d: vertexD.vertex
						},
						edges: {}
					};
					expect(digraph.toDict()).to.deep.equal(expectedDict);
				});
			});

			describe('When one or many vertices directly depends on the deleted one', () => {
				it('should delete the vertex and update the adjacency list of vertices directly depending on it', () => {
					const digraph = new DiGraph<Vertex>();
					const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

					digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
					digraph.addEdges({ from: vertexA.id, to: vertexD.id });
					digraph.addEdges({ from: vertexB.id, to: vertexD.id });
					digraph.addEdges({ from: vertexB.id, to: vertexC.id });
					digraph.addEdges({ from: vertexC.id, to: vertexA.id });

					let expectedDict: DiGraphDict<Vertex> = {
						vertices: {
							a: vertexA.vertex,
							b: vertexB.vertex,
							c: vertexC.vertex,
							d: vertexD.vertex
						},
						edges: {
							a: {
								d: null
							},
							b: {
								d: null,
								c: null
							},
							c: {
								a: null
							}
						}
					};
					expect(digraph.toDict()).to.deep.equal(expectedDict);

					digraph.deleteVertices(vertexD.id);

					expectedDict = {
						vertices: {
							a: vertexA.vertex,
							b: vertexB.vertex,
							c: vertexC.vertex
						},
						edges: {
							b: {
								c: null
							},
							c: {
								a: null
							}
						}
					};
					expect(digraph.toDict()).to.deep.equal(expectedDict);
				});
			});
			describe('When deleting a vertex that does not exist in the graph', () => {
				it('should throw an error', () => {
					const digraph = new DiGraph<Vertex>();
					const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

					digraph.addVertices(vertexA);
					expect(() => digraph.deleteVertices(vertexB.id)).to.throw(
						'Vertices do not exist in the graph: b'
					);
				});
			});
		});
	});

	describe('When managing edges in the graph', () => {
		describe('When adding edges to the graph', () => {
			it('should add edges between vertices', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

				digraph.addVertices(vertexA, vertexB, vertexC);
				digraph.addEdges({ from: vertexB.id, to: vertexA.id });

				expect(Array.from(digraph.getDescendantIds(vertexB.id))).deep.equal([vertexA.id]);

				digraph.addEdges({ from: vertexB.id, to: vertexC.id });
				expect(() => digraph.addVertices(vertexA, vertexB, vertexC)).to.throw(
					'Vertices already exist in the graph: a, b, c'
				);

				expect(Array.from(digraph.getDescendantIds(vertexB.id))).deep.equal([
					vertexA.id,
					vertexC.id
				]);
				expect(digraph.getEdge({ from: vertexB.id, to: vertexA.id })).to.deep.equal(undefined);
			});

			it('should only add edges for vertices already added in the graph', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

				digraph.addVertices(vertexA);
				expect(() => digraph.addEdges({ from: vertexA.id, to: vertexB.id })).to.throw(
					'Edges point to non-existent vertices: b'
				);

				expect(Array.from(digraph.getDescendantIds(vertexA.id))).deep.equal([]);
				const expectedDict: DiGraphDict<Vertex> = {
					vertices: {
						a: vertexA.vertex
					},
					edges: {}
				};
				expect(digraph.toDict()).to.deep.equal(expectedDict);
			});

			it('should not add duplicate edges', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

				digraph.addVertices(vertexA, vertexB, vertexC);
				digraph.addEdges({ from: vertexB.id, to: vertexA.id });
				expect(() => digraph.addEdges({ from: vertexB.id, to: vertexA.id })).to.throw(
					'Edges already exist in the graph: b -> a'
				);

				expect(Array.from(digraph.getDescendantIds(vertexB.id))).deep.equal([vertexA.id]);

				digraph.addEdges({ from: vertexB.id, to: vertexC.id });
				expect(() => digraph.addEdges({ from: vertexB.id, to: vertexC.id })).to.throw(
					'Edges already exist in the graph: b -> c'
				);

				expect(Array.from(digraph.getDescendantIds(vertexB.id))).deep.equal([
					vertexA.id,
					vertexC.id
				]);
			});

			it('should not allow adding an edge from a vertex to the same vertex', () => {
				const digraph = new DiGraph<Vertex>();
				const vertexA: VertexWithId<Vertex> = { id: 'a', vertex: {} };

				digraph.addVertices(vertexA);
				expect(() => digraph.addEdges({ from: vertexA.id, to: vertexA.id })).to.throw(
					'Self-loops are not allowed: a -> a'
				);

				expect(Array.from(digraph.getDescendantIds(vertexA.id))).to.deep.equal([]);
			});

			it('should not allow adding edges with duplicate ids', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

				digraph.addVertices(vertexA, vertexB, vertexC);
				expect(() =>
					digraph.addEdges(
						{ from: vertexA.id, to: vertexB.id },
						{ from: vertexA.id, to: vertexC.id },
						{ from: vertexA.id, to: vertexB.id }
					)
				).to.throw('Duplicate edge ids found in the input: a->b');
			});
		});
		describe('When deleting edges from the graph', () => {
			it('should fail when deleting edges that do not exist', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

				digraph.addVertices(vertexA);
				expect(() => digraph.deleteEdges({ from: vertexA.id, to: vertexB.id })).to.throw(
					'Edges do not exist in the graph: a -> b'
				);
			});
		});
		describe('When updating edges in the graph', () => {
			it('should update the edge if it exists', () => {
				const digraph = new DiGraph<Vertex, Record<string, unknown>>();
				const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

				digraph.addVertices(vertexA, vertexB);
				digraph.addEdges({ from: vertexA.id, to: vertexB.id, edge: {} });

				expect(digraph.getEdge({ from: vertexA.id, to: vertexB.id })).to.deep.equal({});

				digraph.updateEdge({
					from: vertexA.id,
					to: vertexB.id,
					edge: {
						someProperty: 'someValue'
					}
				});

				expect(digraph.getEdge({ from: vertexA.id, to: vertexB.id })).to.deep.equal({
					someProperty: 'someValue'
				});
			});
		});
		describe('When iterating edges', () => {
			it('should iterate over edges in the graph', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

				digraph.addVertices(vertexA, vertexB, vertexC);
				digraph.addEdges({ from: vertexA.id, to: vertexB.id });
				digraph.addEdges({ from: vertexB.id, to: vertexC.id });

				expect(Array.from(digraph.getEdgeIds())).to.deep.equal([
					{ from: vertexA.id, to: vertexB.id },
					{ from: vertexB.id, to: vertexC.id }
				]);
			});
		});
	});

	describe('When traversing the graph', () => {
		describe('When searching for all dependencies DEPENDING ON a given vertex', () => {
			it('should find direct adjacent vertices', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

				digraph.addVertices(vertexA, vertexB, vertexC);
				digraph.addEdges({ from: vertexA.id, to: vertexB.id });

				expect(Array.from(digraph.getAncestors(vertexB.id))).to.deep.equal([vertexA]);

				digraph.addEdges({ from: vertexC.id, to: vertexB.id });

				expect(Array.from(digraph.getAncestors(vertexB.id))).to.deep.equal([vertexA, vertexC]);
			});
		});

		describe('When searching for all dependencies OF a given vertex', () => {
			it('should find direct adjacent vertices', () => {
				const digraph = new DiGraph<Vertex>();
				const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

				digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
				digraph.addEdges({ from: vertexB.id, to: vertexA.id });

				expect(Array.from(digraph.getDescendants(vertexB.id))).deep.equal([vertexA]);

				digraph.addEdges({ from: vertexD.id, to: vertexA.id });
				digraph.addEdges({ from: vertexD.id, to: vertexC.id });

				expect(Array.from(digraph.getDescendants(vertexD.id))).deep.equal([vertexA, vertexC]);
			});
		});
	});

	describe('When constructing DiGraph instances from a raw record', () => {
		it('should construct a DiGraph instance with vertices linked by edges', () => {
			const rawGraph: DiGraphDict<Vertex> = {
				vertices: {
					a: {
						someProperty: 'someValue'
					},
					b: {
						dependencies: []
					},
					c: {}
				},
				edges: {
					b: {
						a: null
					},
					c: {
						b: null
					}
				}
			};

			const digraph = DiGraph.fromDict(rawGraph);

			expect(digraph.toDict()).to.deep.equal(rawGraph);
		});
	});
});
