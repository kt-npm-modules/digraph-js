import { describe, expect, it } from 'vitest';
import { DiGraph, DiGraphDict, VertexWithId } from '../src';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = Record<string, any>;
type Edge = never;

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
        const digraph = new DiGraph<Vertex, Edge>();
        const [vertexA] = [...createRawVertices('a')];

        digraph.addVertices(vertexA);

        expect(digraph.hasVertex(vertexA.id)).to.equal(true);
      });

      it('should not add vertices already in the graph', () => {
        const digraph = new DiGraph<Vertex, Edge>();

        function expectGraphStructure() {
          const expectedDict: DiGraphDict<Vertex, Edge> = {
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

        digraph.addVertices(vertexA, vertexB, vertexBis, vertexC);

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
          const digraph = new DiGraph<Vertex, Edge>();
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
          const digraph = new DiGraph<Vertex, Edge>();
          const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

          expect(digraph.toDict()).to.deep.equal({
            a: vertexA,
            b: vertexB,
            c: vertexC,
            d: vertexD
          });

          digraph.deleteVertices(vertexC.id);

          expect(digraph.toDict()).to.deep.equal({
            a: vertexA,
            b: vertexB,
            d: vertexD
          });
        });
      });

      describe('When one or many vertices directly depends on the deleted one', () => {
        it('should delete the vertex and update the adjacency list of vertices directly depending on it', () => {
          const digraph = new DiGraph<Vertex, Edge>();
          const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
          digraph.addEdges({ from: vertexA.id, to: vertexD.id });
          digraph.addEdges({ from: vertexB.id, to: vertexD.id });
          digraph.addEdges({ from: vertexB.id, to: vertexC.id });
          digraph.addEdges({ from: vertexC.id, to: vertexA.id });

          expect(digraph.toDict()).to.deep.equal({
            a: { ...vertexA, adjacentTo: [vertexD.id] },
            b: { ...vertexB, adjacentTo: [vertexD.id, vertexC.id] },
            c: { ...vertexC, adjacentTo: [vertexA.id] },
            d: { ...vertexD, adjacentTo: [] }
          });

          digraph.deleteVertices(vertexD.id);

          expect(digraph.toDict()).to.deep.equal({
            a: { ...vertexA, adjacentTo: [] },
            b: { ...vertexB, adjacentTo: [vertexC.id] },
            c: { ...vertexC, adjacentTo: [vertexA.id] }
          });
        });
      });
    });
  });

  describe('When managing edges in the graph', () => {
    describe('When adding edges to the graph', () => {
      it('should add edges between vertices', () => {
        const digraph = new DiGraph<Vertex, Edge>();
        const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

        digraph.addVertices(vertexA, vertexB, vertexC);
        digraph.addEdges({ from: vertexB.id, to: vertexA.id });

        expect(digraph.getDescendantIds(vertexB.id)).deep.equal([vertexA.id]);

        digraph.addEdges({ from: vertexB.id, to: vertexC.id });
        digraph.addVertices(vertexA, vertexB, vertexC);

        expect(digraph.getDescendantIds(vertexB.id)).deep.equal([vertexA.id, vertexC.id]);
      });

      it('should only add edges for vertices already added in the graph', () => {
        const digraph = new DiGraph<Vertex, Edge>();
        const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

        digraph.addVertices(vertexA);
        digraph.addEdges({ from: vertexA.id, to: vertexB.id });

        expect(digraph.getDescendantIds(vertexA.id)).deep.equal([]);
        const expectedDict: DiGraphDict<Vertex, Edge> = {
          vertices: {
            a: vertexA,
            b: vertexB
          },
          edges: {}
        };
        expect(digraph.toDict()).to.deep.equal(expectedDict);
      });

      it('should not add duplicate edges', () => {
        const digraph = new DiGraph<Vertex, Edge>();
        const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

        digraph.addVertices(vertexA, vertexB, vertexC);
        digraph.addEdges({ from: vertexB.id, to: vertexA.id });
        digraph.addEdges({ from: vertexB.id, to: vertexA.id });

        expect(digraph.getDescendantIds(vertexB.id)).deep.equal([vertexA.id]);

        digraph.addEdges({ from: vertexB.id, to: vertexC.id });
        digraph.addEdges({ from: vertexB.id, to: vertexC.id });

        expect(digraph.getDescendantIds(vertexB.id)).deep.equal([vertexA.id, vertexC.id]);
      });

      it('should not allow adding an edge from a vertex to the same vertex', () => {
        const digraph = new DiGraph<Vertex, Edge>();
        const vertexA: VertexWithId<Vertex> = { id: 'a', vertex: {} };

        digraph.addVertices(vertexA);
        digraph.addEdges({ from: vertexA.id, to: vertexA.id });

        expect(digraph.getDescendantIds(vertexA.id)).to.deep.equal([]);
      });
    });
  });

  describe('When traversing the graph', () => {
    describe('When searching for all dependencies DEPENDING ON a given vertex', () => {
      it('should find direct adjacent vertices', () => {
        const digraph = new DiGraph<Vertex, Edge>();
        const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

        digraph.addVertices(vertexA, vertexB, vertexC);
        digraph.addEdges({ from: vertexA.id, to: vertexB.id });

        expect(digraph.getAncestors(vertexB.id)).to.deep.equal([vertexA]);

        digraph.addEdges({ from: vertexC.id, to: vertexB.id });

        expect(digraph.getAncestors(vertexB.id)).to.deep.equal([vertexA, vertexC]);
      });
    });

    describe('When searching for all dependencies OF a given vertex', () => {
      it('should find direct adjacent vertices', () => {
        const digraph = new DiGraph<Vertex, Edge>();
        const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

        digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
        digraph.addEdges({ from: vertexB.id, to: vertexA.id });

        expect(digraph.getDescendants(vertexB.id)).deep.equal([vertexA]);

        digraph.addEdges({ from: vertexD.id, to: vertexA.id });
        digraph.addEdges({ from: vertexD.id, to: vertexC.id });

        expect(digraph.getDescendants(vertexD.id)).deep.equal([vertexA, vertexC]);
      });
    });
  });

  describe('When search for circular dependencies in the graph', () => {
    describe('When there is only one cycle in the graph', () => {
      describe('When the cycle is starting from the root vertex', () => {
        describe('When using infinite depth limit for detection', () => {
          it('should detect a cycle of depth 1 between vertices with edges pointing directly to each other', () => {
            const digraph = new DiGraph<Vertex, Edge>();
            const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

            digraph.addVertices(vertexB, vertexA);
            digraph.addEdges({ from: vertexA.id, to: vertexB.id });

            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdges({ from: vertexB.id, to: vertexA.id });

            expect(digraph.hasCycles()).to.equal(true);
            expect(digraph.findCycles()).to.deep.equal([['b', 'a']]);
          });

          it('should detect a cycle of depth 2 with indirect edges pointing to each other', () => {
            const digraph = new DiGraph<Vertex, Edge>();
            const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
              ...createRawVertices('a', 'b', 'c', 'd', 'e')
            ];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
            digraph.addEdges({ from: vertexA.id, to: vertexB.id });
            digraph.addEdges({ from: vertexB.id, to: vertexC.id });
            digraph.addEdges({ from: vertexC.id, to: vertexD.id });
            expect(digraph.hasCycles()).to.equal(false);

            // D ----> A => cycle between A and D traversing B, C
            digraph.addEdges({ from: vertexD.id, to: vertexA.id });
            expect(digraph.hasCycles()).to.equal(true);
            expect(digraph.findCycles()).to.deep.equal([['a', 'b', 'c', 'd']]);
          });

          it('should detect cyclic paths of any given depth', () => {
            const digraph = new DiGraph<Vertex, Edge>();
            const [vertexA, vertexB, vertexC, vertexD] = [...createRawVertices('a', 'b', 'c', 'd')];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
            digraph.addEdges({ from: vertexC.id, to: vertexD.id });
            digraph.addEdges({ from: vertexB.id, to: vertexC.id });
            digraph.addEdges({ from: vertexA.id, to: vertexB.id });
            // D ----> A => cycle between A and D traversing B, C
            digraph.addEdges({ from: vertexD.id, to: vertexA.id });

            expect(digraph.findCycles()).to.deep.equal([['a', 'b', 'c', 'd']]);
          });

          it('should keep only one occurrence of a same cyclic path', () => {
            const digraph = new DiGraph<Vertex, Edge>();

            const [fileA, fileB, fileC] = [...createRawVertices('A.js', 'B.js', 'C.js')];

            digraph.addVertices(fileA, fileB, fileC);
            digraph.addEdges({ from: fileA.id, to: fileB.id });
            digraph.addEdges({ from: fileB.id, to: fileC.id });
            digraph.addEdges({ from: fileC.id, to: fileA.id });

            expect(digraph.findCycles().length).to.equal(1);
            expect(digraph.findCycles()).to.deep.equal([['A.js', 'B.js', 'C.js']]);
          });

          it('should only return nodes involved in the cycle when dealing with direct circular dependency', () => {
            const digraph = new DiGraph<Vertex, Edge>();
            const [vertexA, vertexB, vertexC] = [...createRawVertices('a', 'b', 'c')];

            digraph.addVertices(vertexC, vertexA, vertexB);
            digraph.addEdges({ from: vertexA.id, to: vertexB.id });
            digraph.addEdges({ from: vertexB.id, to: vertexC.id });
            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdges({ from: vertexB.id, to: vertexA.id });

            const cycles = digraph.findCycles();
            expect(cycles).to.deep.equal([['a', 'b']]);
          });

          describe('When dealing with an indirect circular dependency', () => {
            it('scenario n°1: should only keep nodes involved in the cycle', () => {
              const digraph = new DiGraph<Vertex, Edge>();
              const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
                ...createRawVertices('a', 'b', 'c', 'd', 'e')
              ];

              digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
              digraph.addEdges({ from: vertexA.id, to: vertexB.id });
              digraph.addEdges({ from: vertexB.id, to: vertexC.id });
              digraph.addEdges({ from: vertexB.id, to: vertexD.id });
              expect(digraph.hasCycles()).to.equal(false);

              digraph.addEdges({ from: vertexC.id, to: vertexA.id });
              digraph.addEdges({ from: vertexC.id, to: vertexE.id });

              const cycles = digraph.findCycles();
              expect(digraph.hasCycles()).to.equal(true);
              expect(cycles).to.deep.equal([['a', 'b', 'c']]);
            });

            it('scenario n°2: should only keep nodes involved in the cycle', () => {
              const digraph = new DiGraph<Vertex, Edge>();
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

              expect(digraph.findCycles()).to.deep.equal([['a', 'b', 'e']]);
            });
          });
        });

        describe('When providing a max depth limit for detection', () => {
          it('should not detect any cycle as the specified depth is zero', () => {
            const digraph = new DiGraph<Vertex, Edge>();
            const [vertexA, vertexB] = [...createRawVertices('a', 'b')];

            digraph.addVertices(vertexA, vertexB);
            digraph.addEdges({ from: vertexA.id, to: vertexB.id });
            digraph.addEdges({ from: vertexB.id, to: vertexA.id });
            expect(digraph.hasCycles({ maxDepth: 0 })).to.equal(false);
          });

          it('should detect the cycle once the specified depth is greather than or equal to the depth of the cycle', () => {
            const digraph = new DiGraph<Vertex, Edge>();
            const [vertexA, vertexB, vertexC, vertexD] = [
              ...createRawVertices('a', 'b', 'c', 'd', 'e')
            ];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
            digraph.addEdges({ from: vertexA.id, to: vertexB.id });
            digraph.addEdges({ from: vertexB.id, to: vertexC.id });
            digraph.addEdges({ from: vertexC.id, to: vertexD.id });
            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdges({ from: vertexD.id, to: vertexA.id });
            expect(digraph.hasCycles({ maxDepth: 0 })).to.equal(false);
            expect(digraph.hasCycles({ maxDepth: 1 })).to.equal(false);
            expect(digraph.hasCycles({ maxDepth: 2 })).to.equal(false);
            expect(digraph.hasCycles({ maxDepth: 3 })).to.equal(false);
            expect(digraph.hasCycles({ maxDepth: 4 })).to.equal(true);
            expect(digraph.hasCycles({ maxDepth: 20 })).to.equal(true);
          });
        });
      });
    });

    describe('When there are many circular dependencies in the graph', () => {
      describe('When any cycle is starting other than from the root vertex', () => {
        describe('When only one direct cycle should be detected', () => {
          it('scenario n°1: should only keep vertices involved', () => {
            const digraph = new DiGraph<Vertex, Edge>();
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

            const cycles = digraph.findCycles();
            expect(digraph.hasCycles()).to.equal(true);
            expect(cycles).to.deep.equal([['c', 'd']]);
          });

          it('scenario n°2: should only keep vertices involved', () => {
            const digraph = new DiGraph<Vertex, Edge>();
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

            const cycles = digraph.findCycles();
            expect(digraph.hasCycles()).to.equal(true);
            expect(cycles).to.deep.equal([['f', 'c']]);
          });

          it('scenario n°3: should only keep vertices involved', () => {
            const digraph = new DiGraph<Vertex, Edge>();
            const [vertexA, vertexB, vertexP, vertexD, vertexX] = [
              ...createRawVertices('a', 'b', 'p', 'd', 'x')
            ];

            digraph.addVertices(vertexA, vertexB, vertexP, vertexD, vertexX);

            digraph.addEdges({ from: vertexA.id, to: vertexB.id });
            digraph.addEdges({ from: vertexA.id, to: vertexP.id });
            digraph.addEdges({ from: vertexB.id, to: vertexD.id });
            digraph.addEdges({ from: vertexP.id, to: vertexD.id });
            digraph.addEdges({ from: vertexD.id, to: vertexX.id });
            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdges({ from: vertexX.id, to: vertexA.id });
            expect(digraph.findCycles()).to.deep.equal([
              ['a', 'b', 'd', 'x'],
              ['a', 'p', 'd', 'x']
            ]);
          });
        });

        it('should keep two connected cycles separated', () => {
          const digraph = new DiGraph<Vertex, Edge>();
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
          const cycles = digraph.findCycles();
          expect(digraph.hasCycles()).to.equal(true);
          expect(cycles).to.deep.equal([
            ['a', 'b', 'c'],
            ['c', 'd']
          ]);
        });

        it('should detect both independent cycles', () => {
          const digraph = new DiGraph<Vertex, Edge>();
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

          const cycles = digraph.findCycles();
          expect(digraph.hasCycles()).to.equal(true);
          expect(cycles).to.deep.equal([
            ['b', 'c'],
            ['d', 'e']
          ]);
        });
      });
    });
  });

  // describe('When constructing DiGraph instances from a raw record', () => {
  //   it('should construct a DiGraph instance with vertices linked by edges', () => {
  //     const rawGraph = {
  //       a: {
  //         id: 'a',
  //         adjacentTo: [],
  //         body: {
  //           someProperty: 'someValue'
  //         }
  //       },
  //       b: {
  //         id: 'b',
  //         adjacentTo: ['a'],
  //         body: {
  //           dependencies: []
  //         }
  //       },
  //       c: {
  //         id: 'c',
  //         adjacentTo: ['b'],
  //         body: {}
  //       }
  //     };

  //     const digraph = TDiGraph.fromRaw(rawGraph);

  //     expect(digraph.toDict()).to.deep.equal({
  //       a: { id: 'a', adjacentTo: [], body: { someProperty: 'someValue' } },
  //       b: { id: 'b', adjacentTo: ['a'], body: { dependencies: [] } },
  //       c: { id: 'c', adjacentTo: ['b'], body: {} }
  //     });
  //   });
  // });
});
