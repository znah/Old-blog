Title: My first youtube video
Date: 2012-10-30


In a year 2007 I was doing a small course project on cellular
automaton simulation of physical phenomena. I was intrigued by the
simplicity of Lattice-Gas model and its ability to capture the complex
stuff that happens in fluid flows:

> "We have noticed in nature that the behavior of a fluid depends very
little on the nature of the individual particles in that fluid. For
example, the flow of sand is very similar to the flow of water or the
flow of a pile of ball bearings. We have therefore taken advantage of
this fact to invent a type of imaginary particle that is especially
simple for us to simulate. This particle is a perfect ball bearing that
can move at a single speed in one of six directions. The flow of these
particles on a large enough scale is very similar to the flow of natural
fluids."

> Richard Feynman
[(source)]("http://longnow.org/essays/richard-feynman-connection-machine/)


It tried to implement an extension of Lattice-Gas called
Lattice-Boltzmann Model and recorded a small video of the Von Karman
vortex street formation:

http://www.youtube.com/v/CB2aWiesq0g

<a href="http://en.wikipedia.org/wiki/File:Vortex-street-1.jpg">
<img style="float:right; margin:10px" alt="Vortex Street in Clouds" src="http://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Vortex-street-1.jpg/134px-Vortex-street-1.jpg"/>
</a>
I wanted to reproduce this vortex pattern in simulation since I saw this 
beautiful picture on Wikipedia. Later that year I implemented some
extensions to the model to make it stable on higher Reynolds number
flows and ported it on GPU. Seeing my simulation running more then 10x
faster on a rather modest laptop's video card and being able to play
with it in real-time turned me into a fan of GPU computing. Here is one
more video where I tuned the flow to make it more chaotic. Also I there
is a [report (in russian)](http://is.ifmo.ru/download/lattice_boltzmann.pdf) about this work.

http://www.youtube.com/v/8xwULctHPZs


[vortex_cloud] http://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Vortex-street-1.jpg/334px-Vortex-street-1.jpg
